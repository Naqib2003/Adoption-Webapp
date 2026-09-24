const db = require('../../config/db');

const TrackingMeeting = {

  // Moderator arranges a meeting for an approved case they oversee.
  // No participant selection needed — the adopter and guardian are
  // already fixed by the application record itself.
  create: async (application_id, M_ID, meeting_date, meeting_time) => {
    const [result] = await db.query(
      `INSERT INTO lifetime_tracking_meetings (application_id, M_ID, meeting_date, meeting_time)
       VALUES (?, ?, ?, ?)`,
      [application_id, M_ID, meeting_date || null, meeting_time || null]
    );
    return result.insertId;
  },

  // All meetings (scheduled AND completed) for one approved case — this is
  // what the Moderator sees on the Lifetime Tracking detail page, reports
  // included.
  getForApplication: async (application_id, M_ID) => {
    const [rows] = await db.query(
      `SELECT tracking_meeting_id, meeting_date, meeting_time, status, guardian_report, completed_at, created_at
       FROM lifetime_tracking_meetings
       WHERE application_id = ? AND M_ID = ?
       ORDER BY created_at DESC`,
      [application_id, M_ID]
    );
    return rows;
  },

  // Guardian's "Assigned Meetings" list — every meeting tied to a case
  // where THIS guardian was the one who originally cared for the adoptee,
  // scoped via applications.LG_ID.
  getForGuardian: async (LG_ID) => {
    const [rows] = await db.query(
      `SELECT tm.tracking_meeting_id, tm.meeting_date, tm.meeting_time, tm.status,
              ae.name AS adoptee_name, ae.adoptee_type,
              ar.name AS adopter_name
       FROM lifetime_tracking_meetings tm
       JOIN applications ap ON tm.application_id = ap.application_id
       JOIN adoptee_info ae ON ap.AE_ID = ae.AE_ID
       JOIN adopter_info ar ON ap.AR_ID = ar.AR_ID
       WHERE ap.LG_ID = ?
       ORDER BY tm.status ASC, tm.meeting_date ASC`,
      [LG_ID]
    );
    return rows;
  },

  getByIdForGuardian: async (tracking_meeting_id, LG_ID) => {
    const [rows] = await db.query(
      `SELECT tm.tracking_meeting_id, tm.meeting_date, tm.meeting_time, tm.status, tm.guardian_report,
              ae.name AS adoptee_name, ae.adoptee_type,
              ar.name AS adopter_name, ar.email AS adopter_email,
              mo.name AS moderator_name
       FROM lifetime_tracking_meetings tm
       JOIN applications ap ON tm.application_id = ap.application_id
       JOIN adoptee_info ae ON ap.AE_ID = ae.AE_ID
       JOIN adopter_info ar ON ap.AR_ID = ar.AR_ID
       JOIN moderator_info mo ON tm.M_ID = mo.M_ID
       WHERE tm.tracking_meeting_id = ? AND ap.LG_ID = ?`,
      [tracking_meeting_id, LG_ID]
    );
    return rows[0];
  },

  // Guardian's mandatory report, submitted when marking a meeting done.
  // Scoped by ownership (via applications.LG_ID) and only allowed while
  // still 'scheduled' — can't be completed twice.
  complete: async (tracking_meeting_id, LG_ID, report) => {
    const [result] = await db.query(
      `UPDATE lifetime_tracking_meetings tm
       JOIN applications ap ON tm.application_id = ap.application_id
       SET tm.status = 'completed', tm.guardian_report = ?, tm.completed_at = NOW()
       WHERE tm.tracking_meeting_id = ? AND ap.LG_ID = ? AND tm.status = 'scheduled'`,
      [report, tracking_meeting_id, LG_ID]
    );
    return result.affectedRows > 0;
  }

};

module.exports = TrackingMeeting;
