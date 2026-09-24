// Police's mandatory verification reports for all three verifiable
// entities — Adopter, Legal Guardian, Adoptee. Three parallel tables
// (one report row per entity+officer), matching the project's existing
// convention of parallel per-entity structures rather than one
// polymorphic table.
const db = require('../../config/db');

const Report = {

  // ---- Adopter reports ----
  create: async (AR_ID, LE_ID, report_text) => {
    const [result] = await db.query(
      `INSERT INTO adopter_verification_reports (AR_ID, LE_ID, report_text) VALUES (?, ?, ?)`,
      [AR_ID, LE_ID, report_text]
    );
    return result.insertId;
  },

  getLatestForAdopterByPolice: async (AR_ID, LE_ID) => {
    const [rows] = await db.query(
      `SELECT * FROM adopter_verification_reports WHERE AR_ID = ? AND LE_ID = ? ORDER BY created_at DESC LIMIT 1`,
      [AR_ID, LE_ID]
    );
    return rows[0];
  },

  // The most recent report from ANY officer — this is what a Guardian
  // sees when reviewing an applicant. They need to know what police
  // actually found, not just what one specific officer happened to write.
  getLatestForAdopter: async (AR_ID) => {
    const [rows] = await db.query(
      `SELECT * FROM adopter_verification_reports WHERE AR_ID = ? ORDER BY created_at DESC LIMIT 1`,
      [AR_ID]
    );
    return rows[0];
  },

  // ---- Legal Guardian reports ----
  createForGuardian: async (LG_ID, LE_ID, report_text) => {
    const [result] = await db.query(
      `INSERT INTO guardian_verification_reports (LG_ID, LE_ID, report_text) VALUES (?, ?, ?)`,
      [LG_ID, LE_ID, report_text]
    );
    return result.insertId;
  },

  getLatestForGuardianByPolice: async (LG_ID, LE_ID) => {
    const [rows] = await db.query(
      `SELECT * FROM guardian_verification_reports WHERE LG_ID = ? AND LE_ID = ? ORDER BY created_at DESC LIMIT 1`,
      [LG_ID, LE_ID]
    );
    return rows[0];
  },

  // ---- Adoptee reports ----
  createForAdoptee: async (AE_ID, LE_ID, report_text) => {
    const [result] = await db.query(
      `INSERT INTO adoptee_verification_reports (AE_ID, LE_ID, report_text) VALUES (?, ?, ?)`,
      [AE_ID, LE_ID, report_text]
    );
    return result.insertId;
  },

  getLatestForAdopteeByPolice: async (AE_ID, LE_ID) => {
    const [rows] = await db.query(
      `SELECT * FROM adoptee_verification_reports WHERE AE_ID = ? AND LE_ID = ? ORDER BY created_at DESC LIMIT 1`,
      [AE_ID, LE_ID]
    );
    return rows[0];
  }

};

module.exports = Report;
