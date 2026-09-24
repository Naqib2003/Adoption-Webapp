const db = require('../../config/db');

async function getLeastLoadedModeratorId() {
  const [rows] = await db.query(`
    SELECT M_ID,
      (SELECT COUNT(*) FROM applications ap
        WHERE ap.assigned_moderator_M_ID = m.M_ID
          AND ap.status IN ('pending_moderator','pending_lawyer_approval')) AS load_count
    FROM moderator_info m
    ORDER BY load_count ASC, M_ID ASC
    LIMIT 1
  `);
  return rows.length ? rows[0].M_ID : null;
}

const Application = {

  apply: async (AR_ID, AE_ID, LG_ID) => {
    const [result] = await db.query(
      `INSERT INTO applications (AR_ID, AE_ID, LG_ID, status) VALUES (?, ?, ?, 'pending_guardian')`,
      [AR_ID, AE_ID, LG_ID]
    );
    return result.insertId;
  },

  hasApplied: async (AR_ID, AE_ID) => {
    const [rows] = await db.query(
      `SELECT application_id FROM applications WHERE AR_ID = ? AND AE_ID = ?
       AND status NOT IN ('rejected_by_guardian','rejected_by_lawyer')`,
      [AR_ID, AE_ID]
    );
    return rows.length > 0;
  },

  getMineByAdopter: async (AR_ID) => {
    const [rows] = await db.query(
      `SELECT ap.application_id, ap.AE_ID, ap.status, ap.applied_at,
              ae.name AS adoptee_name, ae.adoptee_type
       FROM applications ap
       JOIN adoptee_info ae ON ap.AE_ID = ae.AE_ID
       WHERE ap.AR_ID = ?
       ORDER BY ap.applied_at DESC`,
      [AR_ID]
    );
    return rows;
  },

  // Guardian's New Request tab — grouped by adoptee, only their own adoptees,
  // only applications still awaiting a guardian decision. Now also surfaces
  // whether each applicant has prior adoption experience, so the guardian
  // can see it right in the list without opening every applicant.
  getNewRequestsForGuardian: async (LG_ID) => {
    const [rows] = await db.query(
      `SELECT ap.application_id, ap.AE_ID, ap.AR_ID, ap.applied_at,
              ae.name AS adoptee_name, ae.adoptee_type,
              ar.name AS adopter_name, ar.email AS adopter_email,
              ar.has_prior_adoption_experience
       FROM applications ap
       JOIN adoptee_info ae ON ap.AE_ID = ae.AE_ID
       JOIN adopter_info ar ON ap.AR_ID = ar.AR_ID
       WHERE ap.LG_ID = ? AND ap.status = 'pending_guardian'
       ORDER BY ae.AE_ID, ap.applied_at ASC`,
      [LG_ID]
    );
    return rows;
  },

  // Detail page for a single applicant — now includes full address (with
  // zip), spouse info if any, and prior adoption experience. The Police
  // report is fetched separately by the controller (via reportModel), same
  // pattern used on the Police side.
  getApplicantDetailForGuardian: async (application_id, LG_ID) => {
    const [rows] = await db.query(
      `SELECT ap.application_id, ap.status, ap.applied_at,
              ae.AE_ID, ae.name AS adoptee_name, ae.adoptee_type,
              ar.AR_ID, ar.name AS adopter_name, ar.email AS adopter_email,
              ar.nid_no, ar.dob, ar.gender, ar.religion, ar.profession, ar.age,
              ar.has_prior_adoption_experience, ar.prior_adoption_experience_description,
              aa.house_no, aa.street, aa.zipcode, aa.city_village, aa.district,
              (SELECT phone FROM adopter_phone WHERE AR_ID = ar.AR_ID LIMIT 1) AS phone,
              sp.s_name, sp.s_nid, sp.s_dob, sp.phone AS spouse_phone,
              sp.gender AS spouse_gender, sp.religion AS spouse_religion, sp.profession AS spouse_profession
       FROM applications ap
       JOIN adoptee_info ae ON ap.AE_ID = ae.AE_ID
       JOIN adopter_info ar ON ap.AR_ID = ar.AR_ID
       LEFT JOIN adopter_address aa ON aa.AR_ID = ar.AR_ID
       LEFT JOIN adopter_spouse sp ON sp.AR_ID = ar.AR_ID
       WHERE ap.application_id = ? AND ap.LG_ID = ?`,
      [application_id, LG_ID]
    );
    return rows[0];
  },

  rejectByGuardian: async (application_id, LG_ID) => {
    const [result] = await db.query(
      `UPDATE applications SET status = 'rejected_by_guardian', decided_at = NOW()
       WHERE application_id = ? AND LG_ID = ? AND status = 'pending_guardian'`,
      [application_id, LG_ID]
    );
    return result.affectedRows > 0;
  },

  selectFavorite: async (application_id, LG_ID) => {
    const [rows] = await db.query(
      `SELECT AE_ID FROM applications WHERE application_id = ? AND LG_ID = ? AND status = 'pending_guardian'`,
      [application_id, LG_ID]
    );
    if (rows.length === 0) return false;
    const AE_ID = rows[0].AE_ID;

    const moderatorId = await getLeastLoadedModeratorId();

    await db.query(
      `UPDATE applications SET status = 'pending_moderator', assigned_moderator_M_ID = ?, decided_at = NOW()
       WHERE application_id = ?`,
      [moderatorId, application_id]
    );

    await db.query(
      `UPDATE applications SET status = 'rejected_by_guardian', decided_at = NOW()
       WHERE AE_ID = ? AND application_id != ? AND status = 'pending_guardian'`,
      [AE_ID, application_id]
    );

    await db.query(`UPDATE adoptee_info SET status = 'pending' WHERE AE_ID = ?`, [AE_ID]);

    return true;
  },

  getAdopteesForModerator: async (M_ID) => {
    const [rows] = await db.query(
      `SELECT ap.application_id, ap.AE_ID, ap.status,
              ae.name AS adoptee_name, ae.adoptee_type, ae.dob, ae.gender, ae.age
       FROM applications ap
       JOIN adoptee_info ae ON ap.AE_ID = ae.AE_ID
       WHERE ap.assigned_moderator_M_ID = ? AND ap.status IN ('pending_moderator','pending_lawyer_approval')
       ORDER BY ap.applied_at ASC`,
      [M_ID]
    );
    return rows;
  },

  getAdopteeByIdForModerator: async (application_id, M_ID) => {
    const [rows] = await db.query(
      `SELECT ap.application_id, ap.AE_ID, ap.status, ap.assigned_lawyer_LE_ID,
              ae.name AS adoptee_name, ae.adoptee_type, ae.dob, ae.gender, ae.age, ae.religion, ae.profession
       FROM applications ap
       JOIN adoptee_info ae ON ap.AE_ID = ae.AE_ID
       WHERE ap.application_id = ? AND ap.assigned_moderator_M_ID = ?`,
      [application_id, M_ID]
    );
    return rows[0];
  },

  getFreeLawyers: async () => {
    const [rows] = await db.query(
      `SELECT LE_ID, name, email, phone_no
       FROM legalentity_info
       WHERE entity_type = 'lawyer'
         AND LE_ID NOT IN (
           SELECT assigned_lawyer_LE_ID FROM applications
           WHERE status = 'pending_lawyer_approval' AND assigned_lawyer_LE_ID IS NOT NULL
         )`
    );
    return rows;
  },

  getLawyerByIdForModerator: async (LE_ID) => {
    const [rows] = await db.query(
      `SELECT LE_ID, name, email, phone_no, nid_no, license_no
       FROM legalentity_info WHERE LE_ID = ? AND entity_type = 'lawyer'`,
      [LE_ID]
    );
    return rows[0];
  },

  arrangeMeeting: async ({ application_id, M_ID, LE_ID, AE_ID, meeting_date, meeting_time, notes }) => {
    const [result] = await db.query(
      `UPDATE applications SET status = 'pending_lawyer_approval', assigned_lawyer_LE_ID = ?
       WHERE application_id = ? AND assigned_moderator_M_ID = ? AND status = 'pending_moderator'`,
      [LE_ID, application_id, M_ID]
    );
    if (result.affectedRows === 0) return null;

    const [meetingResult] = await db.query(
      `INSERT INTO meetings (application_id, M_ID, LE_ID, AE_ID, meeting_date, meeting_time, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [application_id, M_ID, LE_ID, AE_ID, meeting_date || null, meeting_time || null, notes || null]
    );
    return meetingResult.insertId;
  },

  getApprovedForModerator: async (M_ID) => {
    const [rows] = await db.query(
      `SELECT ap.application_id, ap.AE_ID, ap.decided_at,
              ae.name AS adoptee_name, ae.adoptee_type
       FROM applications ap
       JOIN adoptee_info ae ON ap.AE_ID = ae.AE_ID
       WHERE ap.assigned_moderator_M_ID = ? AND ap.status = 'approved'
       ORDER BY ap.decided_at DESC`,
      [M_ID]
    );
    return rows;
  },

  getApprovedByIdForModerator: async (application_id, M_ID) => {
    const [rows] = await db.query(
      `SELECT ap.application_id, ap.AE_ID, ap.decided_at,
              ae.name AS adoptee_name, ae.adoptee_type, ae.dob, ae.gender, ae.age,
              ar.name AS adopter_name, ar.email AS adopter_email
       FROM applications ap
       JOIN adoptee_info ae ON ap.AE_ID = ae.AE_ID
       JOIN adopter_info ar ON ap.AR_ID = ar.AR_ID
       WHERE ap.application_id = ? AND ap.assigned_moderator_M_ID = ? AND ap.status = 'approved'`,
      [application_id, M_ID]
    );
    return rows[0];
  },

  getPendingForLawyer: async (LE_ID) => {
    const [rows] = await db.query(
      `SELECT ap.application_id, ap.AE_ID,
              ae.name AS adoptee_name, ae.adoptee_type, ae.dob, ae.gender, ae.age
       FROM applications ap
       JOIN adoptee_info ae ON ap.AE_ID = ae.AE_ID
       WHERE ap.assigned_lawyer_LE_ID = ? AND ap.status = 'pending_lawyer_approval'
       ORDER BY ap.applied_at ASC`,
      [LE_ID]
    );
    return rows;
  },

  getPendingByIdForLawyer: async (application_id, LE_ID) => {
    const [rows] = await db.query(
      `SELECT ap.application_id, ap.AE_ID, ap.AR_ID,
              ae.name AS adoptee_name, ae.adoptee_type, ae.dob, ae.gender, ae.age, ae.religion, ae.profession,
              ar.name AS adopter_name, ar.email AS adopter_email
       FROM applications ap
       JOIN adoptee_info ae ON ap.AE_ID = ae.AE_ID
       JOIN adopter_info ar ON ap.AR_ID = ar.AR_ID
       WHERE ap.application_id = ? AND ap.assigned_lawyer_LE_ID = ? AND ap.status = 'pending_lawyer_approval'`,
      [application_id, LE_ID]
    );
    return rows[0];
  },

  decideByLawyer: async (application_id, LE_ID, status) => {
    const [rows] = await db.query(
      `SELECT AE_ID, AR_ID FROM applications
       WHERE application_id = ? AND assigned_lawyer_LE_ID = ? AND status = 'pending_lawyer_approval'`,
      [application_id, LE_ID]
    );
    if (rows.length === 0) return false;
    const { AE_ID, AR_ID } = rows[0];

    const newStatus = status === 'approved' ? 'approved' : 'rejected_by_lawyer';
    await db.query(
      `UPDATE applications SET status = ?, decided_at = NOW() WHERE application_id = ?`,
      [newStatus, application_id]
    );

    if (newStatus === 'approved') {
      await db.query(`UPDATE adoptee_info SET status = 'placed', AR_ID = ? WHERE AE_ID = ?`, [AR_ID, AE_ID]);
      // The adoptee is now fully adopted — stop accepting donations for
      // them immediately, regardless of what the guardian had it set to.
      // If no donation_settings row exists yet, this UPDATE simply
      // affects zero rows, which is fine.
      await db.query(`UPDATE donation_settings SET allow_donation = FALSE WHERE AE_ID = ?`, [AE_ID]);
    } else {
      await db.query(`UPDATE adoptee_info SET status = 'available' WHERE AE_ID = ?`, [AE_ID]);
    }

    return true;
  },

  getApprovedForLawyer: async (LE_ID) => {
    const [rows] = await db.query(
      `SELECT ap.application_id, ap.AE_ID, ap.decided_at,
              ae.name AS adoptee_name, ae.adoptee_type
       FROM applications ap
       JOIN adoptee_info ae ON ap.AE_ID = ae.AE_ID
       WHERE ap.assigned_lawyer_LE_ID = ? AND ap.status = 'approved'
       ORDER BY ap.decided_at DESC`,
      [LE_ID]
    );
    return rows;
  },

  getApprovedByIdForLawyer: async (application_id, LE_ID) => {
    const [rows] = await db.query(
      `SELECT ap.application_id, ap.AE_ID, ap.decided_at,
              ae.name AS adoptee_name, ae.adoptee_type, ae.dob, ae.gender, ae.age,
              ar.name AS adopter_name, ar.email AS adopter_email
       FROM applications ap
       JOIN adoptee_info ae ON ap.AE_ID = ae.AE_ID
       JOIN adopter_info ar ON ap.AR_ID = ar.AR_ID
       WHERE ap.application_id = ? AND ap.assigned_lawyer_LE_ID = ? AND ap.status = 'approved'`,
      [application_id, LE_ID]
    );
    return rows[0];
  }

};

module.exports = { Application, getLeastLoadedModeratorId };
