const db = require('../../config/db');

function generateDonationId() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(100000 + Math.random() * 900000); // 6 digits
  return `DON-${yyyy}${mm}${dd}-${rand}`;
}

const Donation = {

  // Public: adoptees currently eligible for monetary donation
  getEligibleAdoptees: async () => {
    const [rows] = await db.query(
      `SELECT ae.AE_ID, ae.name, ae.adoptee_type, ae.age, ds.reason, ds.goal_amount,
              COALESCE((SELECT SUM(amount) FROM donations d WHERE d.AE_ID = ae.AE_ID AND d.donation_type = 'money'), 0) AS raised_amount
       FROM adoptee_info ae
       JOIN donation_settings ds ON ds.AE_ID = ae.AE_ID
       WHERE ds.allow_donation = TRUE AND ds.money_enabled = TRUE
       ORDER BY ae.AE_ID DESC`
    );
    return rows;
  },

  getEligibleAdopteeById: async (AE_ID) => {
    const [rows] = await db.query(
      `SELECT ae.AE_ID, ae.name, ae.adoptee_type, ae.age, ae.gender, ds.reason, ds.goal_amount,
              g.name AS guardian_name,
              COALESCE((SELECT SUM(amount) FROM donations d WHERE d.AE_ID = ae.AE_ID AND d.donation_type = 'money'), 0) AS raised_amount
       FROM adoptee_info ae
       JOIN donation_settings ds ON ds.AE_ID = ae.AE_ID
       JOIN guardian_info g ON ae.LG_ID = g.LG_ID
       WHERE ae.AE_ID = ? AND ds.allow_donation = TRUE AND ds.money_enabled = TRUE`,
      [AE_ID]
    );
    return rows[0];
  },

  // Retries once on the astronomically unlikely chance of an ID collision
  createMoneyDonation: async ({ AE_ID, amount, donor_AR_ID, guest_name, guest_email, guest_phone }) => {
    for (let attempt = 0; attempt < 2; attempt++) {
      const donation_id = generateDonationId();
      try {
        await db.query(
          `INSERT INTO donations (donation_id, AE_ID, donation_type, amount, donor_AR_ID, guest_name, guest_email, guest_phone)
           VALUES (?, ?, 'money', ?, ?, ?, ?, ?)`,
          [donation_id, AE_ID, amount, donor_AR_ID || null, guest_name || null, guest_email || null, guest_phone || null]
        );
        return donation_id;
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY' && attempt === 0) continue;
        throw err;
      }
    }
  },

  createNeedBasedDonation: async ({ AE_ID, wishlist_request_id, donor_AR_ID, guest_name, guest_email, guest_phone }) => {
    for (let attempt = 0; attempt < 2; attempt++) {
      const donation_id = generateDonationId();
      try {
        await db.query(
          `INSERT INTO donations (donation_id, AE_ID, donation_type, wishlist_request_id, donor_AR_ID, guest_name, guest_email, guest_phone)
           VALUES (?, ?, 'need_based', ?, ?, ?, ?, ?)`,
          [donation_id, AE_ID, wishlist_request_id, donor_AR_ID || null, guest_name || null, guest_email || null, guest_phone || null]
        );
        return donation_id;
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY' && attempt === 0) continue;
        throw err;
      }
    }
  }

};

module.exports = Donation;
