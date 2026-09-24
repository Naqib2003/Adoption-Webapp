// Read-side queries for meetings, used by the Lawyer's "Meetings" tab.
// Meeting CREATION lives in applicationModel.arrangeMeeting() since it's
// one atomic action together with assigning the lawyer — this model only
// reads.
const db = require('../../config/db');

const Meeting = {

  getForLawyer: async (LE_ID) => {
    const [rows] = await db.query(
      `SELECT me.meeting_id, me.AE_ID, me.meeting_date, me.meeting_time,
              ae.name AS adoptee_name, ae.adoptee_type,
              mo.name AS moderator_name
       FROM meetings me
       JOIN adoptee_info ae ON me.AE_ID = ae.AE_ID
       JOIN moderator_info mo ON me.M_ID = mo.M_ID
       WHERE me.LE_ID = ?
       ORDER BY me.meeting_date ASC, me.meeting_time ASC`,
      [LE_ID]
    );
    return rows;
  },

  getByIdForLawyer: async (meeting_id, LE_ID) => {
    const [rows] = await db.query(
      `SELECT me.meeting_id, me.AE_ID, me.meeting_date, me.meeting_time, me.notes,
              ae.name AS adoptee_name, ae.adoptee_type,
              mo.name AS moderator_name, mo.email AS moderator_email
       FROM meetings me
       JOIN adoptee_info ae ON me.AE_ID = ae.AE_ID
       JOIN moderator_info mo ON me.M_ID = mo.M_ID
       WHERE me.meeting_id = ? AND me.LE_ID = ?`,
      [meeting_id, LE_ID]
    );
    return rows[0];
  }

};

module.exports = Meeting;
