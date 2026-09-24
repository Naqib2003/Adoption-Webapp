// Bridges the pure scoring engine to real database rows. Split into two
// steps so that scoring many adoptees for the SAME adopter (e.g. an
// entire Browse page) only fetches the adopter's own data once instead
// of re-querying it per adoptee.
const db = require('../../config/db');
const { calculateCompatibilityScore } = require('./scoreEngine');
const { calculateAge } = require('../shared/ageUtil');

// adoptee_info.age is now always server-computed at creation time (see
// adopteeModel.create), so this fallback should rarely trigger — kept as
// a defensive safety net for any pre-existing rows created before that
// change.

// Step 1 — fetch everything about the ADOPTER side once
async function getAdopterMatchProfile(AR_ID) {
  const [[adopter]] = await db.query('SELECT * FROM adopter_info WHERE AR_ID = ?', [AR_ID]);
  const [[address]] = await db.query('SELECT * FROM adopter_address WHERE AR_ID = ?', [AR_ID]);
  const [[preferences]] = await db.query('SELECT * FROM adopter_preferences WHERE AR_ID = ?', [AR_ID]);
  const [[spouse]] = await db.query('SELECT * FROM adopter_spouse WHERE AR_ID = ? LIMIT 1', [AR_ID]);
  return { adopter, address, preferences, spouse };
}

// Step 2 — score ONE adoptee against an already-fetched adopter profile
async function scoreAdopteeForAdopter(adopterProfile, AE_ID) {
  const [[adoptee]] = await db.query('SELECT * FROM adoptee_info WHERE AE_ID = ?', [AE_ID]);
  const [[adopteeAddress]] = await db.query('SELECT * FROM adoptee_address WHERE AE_ID = ?', [AE_ID]);
  const [specialNeedsRows] = await db.query('SELECT special_need FROM child_special_needs WHERE AE_ID = ?', [AE_ID]);
  const [[elderly]] = await db.query('SELECT prev_med_record FROM elderly_adoptee WHERE AE_ID = ?', [AE_ID]);

  const { adopter, address, preferences, spouse } = adopterProfile;

  return calculateCompatibilityScore({
    adopterAddress: address,
    adopteeAddress,
    preferredGender: preferences ? preferences.preferred_gender : 'any',
    adopteeGender: adoptee.gender,
    preferredAgeMin: preferences ? preferences.preferred_age_min : null,
    preferredAgeMax: preferences ? preferences.preferred_age_max : null,
    adopteeAge: adoptee.age != null ? adoptee.age : calculateAge(adoptee.dob),
    preferredReligion: preferences ? preferences.preferred_religion : null,
    adopteeReligion: adoptee.religion,
    specialNeeds: specialNeedsRows.map(r => r.special_need),
    prevMedRecord: elderly ? elderly.prev_med_record : null,
    adopterProfession: adopter.profession,
    spouseProfession: spouse ? spouse.profession : null,
    openToSpecialNeeds: preferences ? !!preferences.open_to_special_needs : false
  });
}

module.exports = { getAdopterMatchProfile, scoreAdopteeForAdopter };
