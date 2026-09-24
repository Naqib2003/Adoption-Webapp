const db = require('../../config/db'); 
const { getLeastLoadedPoliceId } = require('../shared/assignPolice');
const { calculateAge } = require('../shared/ageUtil');

const Adoptee = {

  create: async (LG_ID, {
    name, dob, religion, gender, profession, email, adoptee_type,
    house_no, street, zipcode, city_village, district,
    nid_no, prev_med_record, profession_history, phone,
    birth_cert, special_needs
  }) => {
    const age = calculateAge(dob);
    const assignedPoliceId = await getLeastLoadedPoliceId();

    const [result] = await db.query(
      `INSERT INTO adoptee_info
        (name, dob, religion, gender, profession, age, email, adoptee_type, LG_ID, assigned_police_LE_ID)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, dob, religion, gender, profession, age, email, adoptee_type, LG_ID, assignedPoliceId]
    );
    const AE_ID = result.insertId;

    if (house_no || street || zipcode || city_village || district) {
      await db.query(
        `INSERT INTO adoptee_address (AE_ID, house_no, street, zipcode, city_village, district)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [AE_ID, house_no || null, street || null, zipcode || null, city_village || null, district || null]
      );
    }

    if (adoptee_type === 'elderly') {
      await db.query(
        `INSERT INTO elderly_adoptee (AE_ID, nid_no, email, prev_med_record, profession_history)
         VALUES (?, ?, ?, ?, ?)`,
        [AE_ID, nid_no || null, email || null, prev_med_record || null, profession_history || null]
      );
      if (phone) {
        await db.query('INSERT IGNORE INTO elderly_phone (AE_ID, phone) VALUES (?, ?)', [AE_ID, phone]);
      }
    } else if (adoptee_type === 'child') {
      await db.query(
        `INSERT INTO child_adoptee (AE_ID, birth_cert) VALUES (?, ?)`,
        [AE_ID, birth_cert || null]
      );
      if (special_needs) {
        await db.query(
          `INSERT INTO child_special_needs (AE_ID, special_need) VALUES (?, ?)`,
          [AE_ID, special_needs]
        );
      }
    }

    return AE_ID;
  },

  // Guardian's Pending Enlistment tab — now includes BOTH 'pending' and
  // 'rejected' statuses, so a rejected adoptee stays visible instead of
  // vanishing (it previously matched neither this filter nor the
  // Enlisted tab's 'verified' filter — an invisible dead end).
  getPendingByGuardian: async (LG_ID) => {
    const [rows] = await db.query(
      `SELECT AE_ID, name, adoptee_type, dob, gender, age, verification_status
       FROM adoptee_info WHERE LG_ID = ? AND verification_status IN ('pending', 'rejected')
       ORDER BY created_at ASC`,
      [LG_ID]
    );
    return rows;
  },

  getEnlistedByGuardian: async (LG_ID, adoptee_type) => {
    const [rows] = await db.query(
      `SELECT AE_ID, name, adoptee_type, dob, gender, age, status
       FROM adoptee_info WHERE LG_ID = ? AND adoptee_type = ? AND verification_status = 'verified' ORDER BY created_at ASC`,
      [LG_ID, adoptee_type]
    );
    return rows;
  },

  // Guardian's own view of ONE of their adoptees (pending, rejected, or
  // enlisted). Now also includes the saved address — needed to pre-fill
  // the edit/reapply form after a rejection.
  getByIdForGuardian: async (AE_ID, LG_ID) => {
    const [rows] = await db.query(
      `SELECT ai.AE_ID, ai.name, ai.adoptee_type, ai.dob, ai.gender, ai.age, ai.religion, ai.profession, ai.email,
              ai.verification_status, ai.status,
              aa.house_no, aa.street, aa.zipcode, aa.city_village, aa.district
       FROM adoptee_info ai
       LEFT JOIN adoptee_address aa ON aa.AE_ID = ai.AE_ID
       WHERE ai.AE_ID = ? AND ai.LG_ID = ?`,
      [AE_ID, LG_ID]
    );
    return rows[0];
  },

  // Guardian edits a REJECTED enlistment and resubmits it. This UPDATES
  // the existing row (same AE_ID) instead of inserting a new one — that's
  // the actual fix for the duplicate-key error, since birth_cert and
  // elderly nid_no both have UNIQUE constraints and the old rejected row
  // was still sitting there holding that same value the whole time.
  reapply: async (AE_ID, LG_ID, {
    name, dob, religion, gender, profession, email, adoptee_type,
    house_no, street, zipcode, city_village, district,
    nid_no, prev_med_record, profession_history, phone,
    birth_cert, special_needs
  }) => {
    const [check] = await db.query(
      `SELECT AE_ID FROM adoptee_info WHERE AE_ID = ? AND LG_ID = ? AND verification_status = 'rejected'`,
      [AE_ID, LG_ID]
    );
    if (check.length === 0) return false;

    const age = calculateAge(dob);
    const assignedPoliceId = await getLeastLoadedPoliceId();

    await db.query(
      `UPDATE adoptee_info
       SET name = ?, dob = ?, religion = ?, gender = ?, profession = ?, age = ?, email = ?,
           adoptee_type = ?, verification_status = 'pending', verified_by_LE_ID = NULL,
           assigned_police_LE_ID = ?
       WHERE AE_ID = ?`,
      [name, dob, religion, gender, profession, age, email, adoptee_type, assignedPoliceId, AE_ID]
    );

    await db.query(
      `INSERT INTO adoptee_address (AE_ID, house_no, street, zipcode, city_village, district)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         house_no = VALUES(house_no), street = VALUES(street), zipcode = VALUES(zipcode),
         city_village = VALUES(city_village), district = VALUES(district)`,
      [AE_ID, house_no || null, street || null, zipcode || null, city_village || null, district || null]
    );

    if (adoptee_type === 'elderly') {
      await db.query(
        `INSERT INTO elderly_adoptee (AE_ID, nid_no, email, prev_med_record, profession_history)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           nid_no = VALUES(nid_no), email = VALUES(email),
           prev_med_record = VALUES(prev_med_record), profession_history = VALUES(profession_history)`,
        [AE_ID, nid_no || null, email || null, prev_med_record || null, profession_history || null]
      );
      await db.query('DELETE FROM elderly_phone WHERE AE_ID = ?', [AE_ID]);
      if (phone) {
        await db.query('INSERT IGNORE INTO elderly_phone (AE_ID, phone) VALUES (?, ?)', [AE_ID, phone]);
      }
    } else if (adoptee_type === 'child') {
      await db.query(
        `INSERT INTO child_adoptee (AE_ID, birth_cert) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE birth_cert = VALUES(birth_cert)`,
        [AE_ID, birth_cert || null]
      );
      await db.query('DELETE FROM child_special_needs WHERE AE_ID = ?', [AE_ID]);
      if (special_needs) {
        await db.query('INSERT INTO child_special_needs (AE_ID, special_need) VALUES (?, ?)', [AE_ID, special_needs]);
      }
    }

    return true;
  },

  // For Police: pending adoptees assigned to THEM, with limited guardian
  // contact info. Joins guardian_info so the list page can actually show
  // which guardian enlisted the adoptee.
  getPendingForPolice: async (policeLE_ID) => {
    const [rows] = await db.query(
      `SELECT ai.AE_ID, ai.name AS adoptee_name, ai.adoptee_type, ai.dob, ai.gender, ai.age,
              g.name AS guardian_name
       FROM adoptee_info ai
       JOIN guardian_info g ON ai.LG_ID = g.LG_ID
       WHERE ai.verification_status = 'pending' AND ai.assigned_police_LE_ID = ?
       ORDER BY ai.created_at ASC`,
      [policeLE_ID]
    );
    return rows;
  },

  getPendingForPoliceById: async (AE_ID, policeLE_ID) => {
    const [rows] = await db.query(
      `SELECT
         ai.AE_ID, ai.name AS adoptee_name, ai.adoptee_type, ai.dob, ai.gender, ai.age,
         ai.religion, ai.profession,
         aea.house_no AS adoptee_house_no, aea.street AS adoptee_street, aea.zipcode AS adoptee_zipcode,
         aea.city_village AS adoptee_city_village, aea.district AS adoptee_district,
         g.LG_ID, g.name AS guardian_name, g.nid_no AS guardian_nid,
         ga.house_no, ga.street, ga.zipcode, ga.city_village, ga.district,
         (SELECT phone FROM guardian_phone WHERE LG_ID = g.LG_ID LIMIT 1) AS guardian_phone
       FROM adoptee_info ai
       LEFT JOIN adoptee_address aea ON aea.AE_ID = ai.AE_ID
       JOIN guardian_info g ON ai.LG_ID = g.LG_ID
       LEFT JOIN guardian_address ga ON ga.LG_ID = g.LG_ID
       WHERE ai.AE_ID = ? AND ai.assigned_police_LE_ID = ?`,
      [AE_ID, policeLE_ID]
    );
    return rows[0];
  },

  verifyAdoptee: async (AE_ID, status, policeLE_ID) => {
    const [result] = await db.query(
      `UPDATE adoptee_info SET verification_status = ?, verified_by_LE_ID = ?
       WHERE AE_ID = ? AND assigned_police_LE_ID = ?`,
      [status, policeLE_ID, AE_ID, policeLE_ID]
    );
    return result.affectedRows > 0;
  },

  getAllAvailable: async () => {
    const [rows] = await db.query(
      `SELECT AE_ID, name, adoptee_type, dob, gender, age, religion
       FROM adoptee_info WHERE verification_status = 'verified' AND status = 'available' ORDER BY created_at DESC`
    );
    return rows;
  },

  getAvailableById: async (AE_ID) => {
    const [rows] = await db.query(
      `SELECT AE_ID, name, adoptee_type, dob, gender, age, religion, profession
       FROM adoptee_info WHERE AE_ID = ? AND verification_status = 'verified' AND status = 'available'`,
      [AE_ID]
    );
    return rows[0];
  }

};

module.exports = Adoptee;
