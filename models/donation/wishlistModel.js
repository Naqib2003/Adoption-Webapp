const db = require('../../config/db');

const Wishlist = {

  create: async (AE_ID, LG_ID, description) => {
    const [ownerCheck] = await db.query('SELECT AE_ID FROM adoptee_info WHERE AE_ID = ? AND LG_ID = ?', [AE_ID, LG_ID]);
    if (ownerCheck.length === 0) return null;

    const [result] = await db.query(
      `INSERT INTO wishlist_item (AE_ID, LG_ID, item_name, description, status)
       VALUES (?, ?, ?, ?, 'needed')`,
      [AE_ID, LG_ID, description.slice(0, 150), description]
    );
    return result.insertId;
  },

  // Guardian's own requests, across all their adoptees
  getForGuardian: async (LG_ID) => {
    const [rows] = await db.query(
      `SELECT wi.item_id, wi.AE_ID, wi.description, wi.status,
              ae.name AS adoptee_name, ae.adoptee_type
       FROM wishlist_item wi
       JOIN adoptee_info ae ON wi.AE_ID = ae.AE_ID
       WHERE wi.LG_ID = ?
       ORDER BY wi.item_id DESC`,
      [LG_ID]
    );
    return rows;
  },

  // Public: only requests still needed, only for adoptees the guardian has
  // opted into need-based donations for
  getPublicNeeded: async () => {
    const [rows] = await db.query(
      `SELECT wi.item_id, wi.AE_ID, wi.description,
              ae.name AS adoptee_name, ae.adoptee_type,
              g.name AS guardian_name
       FROM wishlist_item wi
       JOIN adoptee_info ae ON wi.AE_ID = ae.AE_ID
       JOIN guardian_info g ON wi.LG_ID = g.LG_ID
       JOIN donation_settings ds ON ds.AE_ID = wi.AE_ID
       WHERE wi.status = 'needed' AND ds.allow_donation = TRUE AND ds.need_based_enabled = TRUE
       ORDER BY wi.item_id DESC`
    );
    return rows;
  },

  getPublicNeededById: async (item_id) => {
    const [rows] = await db.query(
      `SELECT wi.item_id, wi.AE_ID, wi.description, wi.status,
              ae.name AS adoptee_name, ae.adoptee_type,
              g.name AS guardian_name
       FROM wishlist_item wi
       JOIN adoptee_info ae ON wi.AE_ID = ae.AE_ID
       JOIN guardian_info g ON wi.LG_ID = g.LG_ID
       JOIN donation_settings ds ON ds.AE_ID = wi.AE_ID
       WHERE wi.item_id = ? AND ds.allow_donation = TRUE AND ds.need_based_enabled = TRUE`,
      [item_id]
    );
    return rows[0];
  },

  markFulfilled: async (item_id) => {
    const [result] = await db.query(
      `UPDATE wishlist_item SET status = 'fulfilled' WHERE item_id = ? AND status = 'needed'`,
      [item_id]
    );
    return result.affectedRows > 0;
  }

};

module.exports = Wishlist;
