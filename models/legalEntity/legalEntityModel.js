// Handles the "Legal Entity" role, which is either Police or Lawyer
// (entity_type column decides which). Both share the legalentity_info table.
const db = require('../../config/db');
const { calculateAge } = require('../shared/ageUtil');

const LegalEntity = {

  findByEmail: async (email) => {
    const [rows] = await db.query('SELECT * FROM legalentity_info WHERE email = ?', [email]);
    return rows[0];
  },

  findById: async (LE_ID) => {
    const [rows] = await db.query('SELECT * FROM legalentity_info WHERE LE_ID = ?', [LE_ID]);
    return rows[0];
  },

  create: async ({ name, nid_no, dob, gender, phone_no, email, username, entity_type, badge_no, license_no, password_hash }) => {
    const age = calculateAge(dob);
    const [result] = await db.query(
      `INSERT INTO legalentity_info
        (name, nid_no, dob, age, gender, phone_no, email, username, entity_type, badge_no, license_no, password_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, nid_no, dob, age, gender, phone_no, email, username, entity_type, badge_no || null, license_no || null, password_hash]
    );
    return result.insertId;
  },

  updateProfile: async (LE_ID, { name, phone_no, age }) => {
    await db.query(
      `UPDATE legalentity_info SET name = ?, phone_no = ?, age = ? WHERE LE_ID = ?`,
      [name, phone_no, age, LE_ID]
    );
  }

};

module.exports = LegalEntity;
