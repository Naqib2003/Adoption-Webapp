// ============================================================
// Adopter <-> Adoptee compatibility "fitness function".
// Pure logic, no database calls — takes plain data in, returns a score
// and a human-readable breakdown out. Kept separate from the DB-wired
// wrapper (matchModel.js) so this half can be reasoned about, tested,
// or explained on its own.
// ============================================================

const WEIGHTS = {
  LOCATION_ZIP_MATCH: 30,
  LOCATION_CITY_MATCH: 20,
  LOCATION_DISTRICT_MATCH: 10,
  LOCATION_DISTRICT_MISMATCH: -15,

  GENDER_MATCH: 15,
  GENDER_MISMATCH: -20,

  AGE_IN_RANGE: 25,
  AGE_OUT_OF_RANGE_PER_YEAR: -3,
  AGE_OUT_OF_RANGE_MAX_PENALTY: -25,

  RELIGION_MATCH: 15,

  CARE_CAPACITY_BONUS: 10,
  CARE_CAPACITY_PENALTY: -50
};

// Best-effort keyword check on a free-text profession field. This is a
// heuristic, not a verified credential — it's why open_to_special_needs
// exists as an explicit opt-in alternative below, for adopters whose
// profession text doesn't happen to contain one of these words.
const HEALTHCARE_KEYWORDS = [
  'nurse', 'doctor', 'physician', 'medical', 'healthcare', 'health care',
  'caregiver', 'caretaker', 'therapist', 'psychiatrist', 'psychologist',
  'paramedic', 'surgeon', 'pediatrician', 'geriatric', 'social worker'
];

function hasHealthcareBackground(profession) {
  if (!profession) return false;
  const p = profession.toLowerCase();
  return HEALTHCARE_KEYWORDS.some(k => p.includes(k));
}

function scoreLocation(adopterAddress, adopteeAddress) {
  if (!adopterAddress || !adopteeAddress) {
    return { points: 0, reason: 'Address data unavailable' };
  }
  if (adopterAddress.zipcode && adopterAddress.zipcode === adopteeAddress.zipcode) {
    return { points: WEIGHTS.LOCATION_ZIP_MATCH, reason: 'Exact ZIP code match' };
  }
  if (adopterAddress.city_village && adopterAddress.city_village === adopteeAddress.city_village) {
    return { points: WEIGHTS.LOCATION_CITY_MATCH, reason: 'Same city/village' };
  }
  if (adopterAddress.district && adopterAddress.district === adopteeAddress.district) {
    return { points: WEIGHTS.LOCATION_DISTRICT_MATCH, reason: 'Same district' };
  }
  return { points: WEIGHTS.LOCATION_DISTRICT_MISMATCH, reason: 'Different district' };
}

function scoreGender(preferredGender, adopteeGender) {
  if (!preferredGender || preferredGender === 'any' || preferredGender === adopteeGender) {
    return { points: WEIGHTS.GENDER_MATCH, reason: 'Matches stated gender preference' };
  }
  return { points: WEIGHTS.GENDER_MISMATCH, reason: 'Does not match stated gender preference' };
}

function scoreAge(minAge, maxAge, adopteeAge) {
  if (minAge == null || maxAge == null) {
    return { points: 0, reason: 'No age preference set' };
  }
  if (adopteeAge == null) {
    return { points: 0, reason: "Adoptee's age is unknown" };
  }
  if (adopteeAge >= minAge && adopteeAge <= maxAge) {
    return { points: WEIGHTS.AGE_IN_RANGE, reason: `Age ${adopteeAge} is within preferred range ${minAge}-${maxAge}` };
  }
  const yearsOutside = adopteeAge < minAge ? (minAge - adopteeAge) : (adopteeAge - maxAge);
  const penalty = Math.max(WEIGHTS.AGE_OUT_OF_RANGE_MAX_PENALTY, yearsOutside * WEIGHTS.AGE_OUT_OF_RANGE_PER_YEAR);
  return { points: penalty, reason: `Age ${adopteeAge} is ${yearsOutside} year(s) outside preferred range ${minAge}-${maxAge}` };
}

// Now compares against the Adopter's EXPLICITLY STATED religion
// preference (adopter_preferences.preferred_religion), not their own
// religion — those aren't the same thing, and assuming someone wants a
// match on their own religion was never something the adopter actually said.
function scoreReligion(preferredReligion, adopteeReligion) {
  if (!preferredReligion || preferredReligion.toLowerCase() === 'any') {
    return { points: 0, reason: 'No religion preference set' };
  }
  if (adopteeReligion && preferredReligion.toLowerCase() === adopteeReligion.toLowerCase()) {
    return { points: WEIGHTS.RELIGION_MATCH, reason: 'Matches stated religion preference' };
  }
  return { points: 0, reason: 'Does not match stated religion preference (not penalized — a soft reward only)' };
}

function scoreCareCapacity({ specialNeeds, prevMedRecord, adopterProfession, spouseProfession, openToSpecialNeeds }) {
  const needsCare = (specialNeeds && specialNeeds.length > 0) || (prevMedRecord && prevMedRecord.trim() !== '');
  if (!needsCare) {
    return { points: 0, reason: 'No special needs or medical history on file' };
  }
  const capable = openToSpecialNeeds || hasHealthcareBackground(adopterProfession) || hasHealthcareBackground(spouseProfession);
  if (capable) {
    return { points: WEIGHTS.CARE_CAPACITY_BONUS, reason: 'Adopter has a healthcare background or opted in for special care' };
  }
  return { points: WEIGHTS.CARE_CAPACITY_PENALTY, reason: 'Adoptee has special needs/medical history; adopter shows no indicated capacity for care' };
}

// Theoretical bounds of the raw score, used only to normalize into a
// friendlier 0-100 "% compatibility" for display purposes.
const MIN_POSSIBLE_SCORE = WEIGHTS.LOCATION_DISTRICT_MISMATCH + WEIGHTS.GENDER_MISMATCH + WEIGHTS.AGE_OUT_OF_RANGE_MAX_PENALTY + 0 + WEIGHTS.CARE_CAPACITY_PENALTY;
const MAX_POSSIBLE_SCORE = WEIGHTS.LOCATION_ZIP_MATCH + WEIGHTS.GENDER_MATCH + WEIGHTS.AGE_IN_RANGE + WEIGHTS.RELIGION_MATCH + WEIGHTS.CARE_CAPACITY_BONUS;

function calculateCompatibilityScore(input) {
  const {
    adopterAddress, adopteeAddress,
    preferredGender, adopteeGender,
    preferredAgeMin, preferredAgeMax, adopteeAge,
    preferredReligion, adopteeReligion,
    specialNeeds, prevMedRecord,
    adopterProfession, spouseProfession, openToSpecialNeeds
  } = input;

  const location = scoreLocation(adopterAddress, adopteeAddress);
  const gender = scoreGender(preferredGender, adopteeGender);
  const age = scoreAge(preferredAgeMin, preferredAgeMax, adopteeAge);
  const religion = scoreReligion(preferredReligion, adopteeReligion);
  const care = scoreCareCapacity({ specialNeeds, prevMedRecord, adopterProfession, spouseProfession, openToSpecialNeeds });

  const breakdown = { location, gender, age, religion, care };
  const rawScore = location.points + gender.points + age.points + religion.points + care.points;

  const normalized = Math.round(((rawScore - MIN_POSSIBLE_SCORE) / (MAX_POSSIBLE_SCORE - MIN_POSSIBLE_SCORE)) * 100);
  const compatibilityPercent = Math.max(0, Math.min(100, normalized));

  return { rawScore, compatibilityPercent, breakdown };
}

module.exports = { calculateCompatibilityScore, WEIGHTS };
