const db = require('../../config/db');

const Preferences = {

  get: async (AR_ID) => {
    const [rows] = await db.query('SELECT * FROM adopter_preferences WHERE AR_ID = ?', [AR_ID]);
    return rows[0];
  },

  upsert: async (AR_ID, { preferred_age_min, preferred_age_max, preferred_gender, preferred_religion, open_to_special_needs }) => {
    await db.query(
      `INSERT INTO adopter_preferences (AR_ID, preferred_age_min, preferred_age_max, preferred_gender, preferred_religion, open_to_special_needs)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         preferred_age_min = VALUES(preferred_age_min),
         preferred_age_max = VALUES(preferred_age_max),
         preferred_gender = VALUES(preferred_gender),
         preferred_religion = VALUES(preferred_religion),
         open_to_special_needs = VALUES(open_to_special_needs)`,
      [AR_ID, preferred_age_min || null, preferred_age_max || null, preferred_gender || 'any', preferred_religion || null, !!open_to_special_needs]
    );
  }

};

module.exports = Preferences;
