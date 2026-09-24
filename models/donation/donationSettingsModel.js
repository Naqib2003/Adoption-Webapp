const db = require('../../config/db');

const DonationSettings = {

  getForGuardian: async (AE_ID, LG_ID) => {
    const [rows] = await db.query(
      `SELECT ds.* FROM donation_settings ds
       JOIN adoptee_info ae ON ds.AE_ID = ae.AE_ID
       WHERE ds.AE_ID = ? AND ae.LG_ID = ?`,
      [AE_ID, LG_ID]
    );
    return rows[0];
  },

  // Insert-or-update in one call. Now also blocks the update entirely once
  // the adoptee's status is 'placed' — a fully-adopted adoptee shouldn't
  // keep accepting donations or have its settings changed, even though it
  // stays visible in the guardian's Enlisted tab forever for their records.
  upsert: async (AE_ID, LG_ID, { allow_donation, money_enabled, need_based_enabled, goal_amount, reason }) => {
    const [rows] = await db.query(
      'SELECT status FROM adoptee_info WHERE AE_ID = ? AND LG_ID = ?',
      [AE_ID, LG_ID]
    );
    if (rows.length === 0) return { success: false, reason: 'not_found' };
    if (rows[0].status === 'placed') return { success: false, reason: 'already_adopted' };

    await db.query(
      `INSERT INTO donation_settings (AE_ID, allow_donation, money_enabled, need_based_enabled, goal_amount, reason)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         allow_donation = VALUES(allow_donation),
         money_enabled = VALUES(money_enabled),
         need_based_enabled = VALUES(need_based_enabled),
         goal_amount = VALUES(goal_amount),
         reason = VALUES(reason)`,
      [AE_ID, !!allow_donation, !!money_enabled, !!need_based_enabled, goal_amount || null, reason || null]
    );
    return { success: true };
  }

};

module.exports = DonationSettings;
