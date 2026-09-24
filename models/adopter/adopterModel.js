// This model handles the "Adopter" (family) role.
// It reads/writes the adopter_info table (and related address/phone/spouse tables).
const db = require('../../config/db');
const { getLeastLoadedPoliceId } = require('../shared/assignPolice');
const { calculateAge } = require('../shared/ageUtil');

const Adopter = {

  findByEmail: async (email) => {
    const [rows] = await db.query(
      'SELECT * FROM adopter_info WHERE email = ?',
      [email]
    );
    return rows[0];
  },

  findById: async (AR_ID) => {
    const [rows] = await db.query(
      'SELECT * FROM adopter_info WHERE AR_ID = ?',
      [AR_ID]
    );
    return rows[0];
  },

  // Creates a new adopter account. Starts as verification_status = 'pending'
  // by default (set at the database level) —  cannot use adopter-only
  // features until a Legal Entity (police) verifies them.
  create: async ({ name, nid_no, dob, religion, gender, profession, email, username, password_hash,
                   has_prior_adoption_experience, prior_adoption_experience_description }) => {
    const age = calculateAge(dob);
    const assignedPoliceId = await getLeastLoadedPoliceId();
    const [result] = await db.query(
      `INSERT INTO adopter_info
        (name, nid_no, dob, religion, gender, profession, age, email, username, password_hash,
         has_prior_adoption_experience, prior_adoption_experience_description, assigned_police_LE_ID)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, nid_no, dob, religion, gender, profession, age, email, username, password_hash,
       !!has_prior_adoption_experience,
       has_prior_adoption_experience ? (prior_adoption_experience_description || null) : null,
       assignedPoliceId]
    );
    return result.insertId;
  },

  updateProfile: async (AR_ID, { name, religion, profession, age }) => {
    await db.query(
      `UPDATE adopter_info
       SET name = ?, religion = ?, profession = ?, age = ?
       WHERE AR_ID = ?`,
      [name, religion, profession, age, AR_ID]
    );
  },

  // ---- Address (1:1) ----
  upsertAddress: async (AR_ID, { house_no, street, zipcode, city_village, district }) => {
    await db.query(
      `INSERT INTO adopter_address (AR_ID, house_no, street, zipcode, city_village, district)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         house_no = VALUES(house_no),
         street = VALUES(street),
         zipcode = VALUES(zipcode),
         city_village = VALUES(city_village),
         district = VALUES(district)`,
      [AR_ID, house_no, street, zipcode, city_village, district]
    );
  },

  getAddress: async (AR_ID) => {
    const [rows] = await db.query(
      'SELECT * FROM adopter_address WHERE AR_ID = ?',
      [AR_ID]
    );
    return rows[0];
  },

  // ---- Phones (1:many) ----
  addPhone: async (AR_ID, phone) => {
    await db.query(
      'INSERT IGNORE INTO adopter_phone (AR_ID, phone) VALUES (?, ?)',
      [AR_ID, phone]
    );
  },

  getPhones: async (AR_ID) => {
    const [rows] = await db.query(
      'SELECT phone FROM adopter_phone WHERE AR_ID = ?',
      [AR_ID]
    );
    return rows.map(r => r.phone);
  },

  // ---- Spouse (optional, 1:1 in practice — a person has at most one
  // currently-relevant spouse record) ----
  addSpouse: async (AR_ID, { s_name, s_nid, s_dob, phone, gender, religion, profession }) => {
    await db.query(
      `INSERT INTO adopter_spouse (s_nid, AR_ID, s_name, s_dob, phone, gender, religion, profession)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [s_nid, AR_ID, s_name, s_dob || null, phone || null, gender || null, religion || null, profession || null]
    );
  },

  getSpouse: async (AR_ID) => {
    const [rows] = await db.query('SELECT * FROM adopter_spouse WHERE AR_ID = ? LIMIT 1', [AR_ID]);
    return rows[0];
  },

  // ---- Combined profile ----
  getFullProfile: async (AR_ID) => {
    const info = await Adopter.findById(AR_ID);
    if (!info) return null;
    const address = await Adopter.getAddress(AR_ID);
    const phones = await Adopter.getPhones(AR_ID);
    const spouse = await Adopter.getSpouse(AR_ID);
    return { ...info, address, phones, spouse };
  },

  // Used later by the Legal Entity (police) side to approve/reject an adopter.
  // Not called anywhere yet — this is the hook the police controller will use.
  setVerificationStatus: async (AR_ID, status, LE_ID) => {
    await db.query(
      `UPDATE adopter_info SET verification_status = ?, verified_by_LE_ID = ? WHERE AR_ID = ?`,
      [status, LE_ID, AR_ID]
    );
  },

  // For Police detail page: one adopter, scoped to the officer's own case
  getByIdForPolice: async (AR_ID, policeLE_ID) => {
    const [rows] = await db.query(
      `SELECT ai.AR_ID, ai.name, ai.nid_no, ai.dob, ai.gender, ai.email, ai.profession, ai.age, ai.religion, ai.verification_status,
              ai.has_prior_adoption_experience, ai.prior_adoption_experience_description,
              aa.house_no, aa.street, aa.zipcode, aa.city_village, aa.district
       FROM adopter_info ai
       LEFT JOIN adopter_address aa ON aa.AR_ID = ai.AR_ID
       WHERE ai.AR_ID = ? AND ai.assigned_police_LE_ID = ?`,
      [AR_ID, policeLE_ID]
    );
    return rows[0];
  }

};

module.exports = Adopter;
