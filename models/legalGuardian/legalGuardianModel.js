// Handles the "Legal Guardian" role (e.g. orphanage / care institution).
const db = require('../../config/db');
const { getLeastLoadedPoliceId } = require('../shared/assignPolice');
const { calculateAge } = require('../shared/ageUtil');

const LegalGuardian = {

  findByEmail: async (email) => {
    const [rows] = await db.query('SELECT * FROM guardian_info WHERE email = ?', [email]);
    return rows[0];
  },

  findById: async (LG_ID) => {
    const [rows] = await db.query('SELECT * FROM guardian_info WHERE LG_ID = ?', [LG_ID]);
    return rows[0];
  },

  create: async ({ name, nid_no, dob, religion, gender, profession, email, username, password_hash }) => {
    const age = calculateAge(dob);
    const assignedPoliceId = await getLeastLoadedPoliceId();
    const [result] = await db.query(
      `INSERT INTO guardian_info
        (name, nid_no, dob, religion, gender, profession, age, email, username, password_hash, assigned_police_LE_ID)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, nid_no, dob, religion, gender, profession, age, email, username, password_hash, assignedPoliceId]
    );
    return result.insertId;
  },

  updateProfile: async (LG_ID, { name, religion, profession, age }) => {
    await db.query(
      `UPDATE guardian_info SET name = ?, religion = ?, profession = ?, age = ? WHERE LG_ID = ?`,
      [name, religion, profession, age, LG_ID]
    );
  },

  upsertAddress: async (LG_ID, { house_no, street, zipcode, city_village, district }) => {
    await db.query(
      `INSERT INTO guardian_address (LG_ID, house_no, street, zipcode, city_village, district)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         house_no = VALUES(house_no), street = VALUES(street), zipcode = VALUES(zipcode),
         city_village = VALUES(city_village), district = VALUES(district)`,
      [LG_ID, house_no, street, zipcode, city_village, district]
    );
  },

  getAddress: async (LG_ID) => {
    const [rows] = await db.query('SELECT * FROM guardian_address WHERE LG_ID = ?', [LG_ID]);
    return rows[0];
  },

  addPhone: async (LG_ID, phone) => {
    await db.query('INSERT IGNORE INTO guardian_phone (LG_ID, phone) VALUES (?, ?)', [LG_ID, phone]);
  },

  getPhones: async (LG_ID) => {
    const [rows] = await db.query('SELECT phone FROM guardian_phone WHERE LG_ID = ?', [LG_ID]);
    return rows.map(r => r.phone);
  },

  getFullProfile: async (LG_ID) => {
    const info = await LegalGuardian.findById(LG_ID);
    if (!info) return null;
    const address = await LegalGuardian.getAddress(LG_ID);
    const phones = await LegalGuardian.getPhones(LG_ID);
    return { ...info, address, phones };
  },

  // Used later by the Legal Entity (police) side to approve/reject a guardian.
  setVerificationStatus: async (LG_ID, status, LE_ID) => {
    await db.query(
      `UPDATE guardian_info SET verification_status = ?, verified_by_LE_ID = ? WHERE LG_ID = ?`,
      [status, LE_ID, LG_ID]
    );
  },

  // For Police detail page: one guardian, scoped to the officer's own case
  getByIdForPolice: async (LG_ID, policeLE_ID) => {
    const [rows] = await db.query(
      `SELECT gi.LG_ID, gi.name, gi.nid_no, gi.dob, gi.gender, gi.email, gi.profession, gi.age, gi.religion, gi.verification_status,
              ga.house_no, ga.street, ga.zipcode, ga.city_village, ga.district
       FROM guardian_info gi
       LEFT JOIN guardian_address ga ON ga.LG_ID = gi.LG_ID
       WHERE gi.LG_ID = ? AND gi.assigned_police_LE_ID = ?`,
      [LG_ID, policeLE_ID]
    );
    return rows[0];
  }

};

module.exports = LegalGuardian;
