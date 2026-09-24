// Handles Police-specific actions: reviewing and verifying pending
// Adopter and Legal Guardian profiles — scoped to whichever police
// officer is asking, never the full list across all officers.
const db = require('../../config/db');

const Police = {

  getPendingAdopters: async (policeLE_ID) => {
    const [rows] = await db.query(
      `SELECT AR_ID, name, nid_no, dob, gender, email, profession, age, verification_status
       FROM adopter_info
       WHERE verification_status = 'pending' AND assigned_police_LE_ID = ?
       ORDER BY created_at ASC`,
      [policeLE_ID]
    );
    return rows;
  },

  getPendingGuardians: async (policeLE_ID) => {
    const [rows] = await db.query(
      `SELECT LG_ID, name, nid_no, dob, gender, email, profession, age, verification_status
       FROM guardian_info
       WHERE verification_status = 'pending' AND assigned_police_LE_ID = ?
       ORDER BY created_at ASC`,
      [policeLE_ID]
    );
    return rows;
  },

  // Returns true only if this AR_ID was actually assigned to this officer
  // (the WHERE clause enforces that — it's not just a courtesy check).
  verifyAdopter: async (AR_ID, status, policeLE_ID) => {
    const [result] = await db.query(
      `UPDATE adopter_info
       SET verification_status = ?, verified_by_LE_ID = ?
       WHERE AR_ID = ? AND assigned_police_LE_ID = ?`,
      [status, policeLE_ID, AR_ID, policeLE_ID]
    );
    return result.affectedRows > 0;
  },

  verifyGuardian: async (LG_ID, status, policeLE_ID) => {
    const [result] = await db.query(
      `UPDATE guardian_info
       SET verification_status = ?, verified_by_LE_ID = ?
       WHERE LG_ID = ? AND assigned_police_LE_ID = ?`,
      [status, policeLE_ID, LG_ID, policeLE_ID]
    );
    return result.affectedRows > 0;
  }

};

module.exports = Police;
