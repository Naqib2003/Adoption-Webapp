const { Application } = require('../../models/application/applicationModel');
const Moderator = require('../../models/moderator/moderatorModel');
const TrackingMeeting = require('../../models/tracking/trackingMeetingModel');
const db = require('../../config/db');

const moderatorController = {

  getDashboard: async (req, res) => {
    try {
      const moderator = await Moderator.findById(req.session.userId);
      if (!moderator) return res.status(404).json({ error: 'Not found.' });
      res.json({ name: moderator.name });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not load dashboard.' });
    }
  },

  getAdoptees: async (req, res) => {
    try {
      const adoptees = await Application.getAdopteesForModerator(req.session.userId);
      res.json(adoptees);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not load adoptees.' });
    }
  },

  getAdopteeById: async (req, res) => {
    try {
      const adoptee = await Application.getAdopteeByIdForModerator(req.params.id, req.session.userId);
      if (!adoptee) return res.status(404).json({ error: 'Not found or not assigned to you.' });
      res.json(adoptee);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not load adoptee.' });
    }
  },

  getFreeLawyers: async (req, res) => {
    try {
      const lawyers = await Application.getFreeLawyers();
      res.json(lawyers);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not load lawyers.' });
    }
  },

  getLawyerById: async (req, res) => {
    try {
      const lawyer = await Application.getLawyerByIdForModerator(req.params.id);
      if (!lawyer) return res.status(404).json({ error: 'Not found.' });
      res.json(lawyer);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not load lawyer.' });
    }
  },

  arrangeMeeting: async (req, res) => {
    try {
      const { application_id, LE_ID, meeting_date, meeting_time, notes } = req.body;
      if (!application_id || !LE_ID) {
        return res.status(400).json({ error: 'application_id and LE_ID are required.' });
      }
      const case_ = await Application.getAdopteeByIdForModerator(application_id, req.session.userId);
      if (!case_) return res.status(404).json({ error: 'Case not found or not assigned to you.' });

      const meeting_id = await Application.arrangeMeeting({
        application_id, M_ID: req.session.userId, LE_ID, AE_ID: case_.AE_ID, meeting_date, meeting_time, notes
      });
      if (!meeting_id) return res.status(409).json({ error: 'This case is not awaiting lawyer assignment.' });

      res.status(201).json({ message: 'Lawyer assigned and meeting arranged.', meeting_id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not arrange meeting.' });
    }
  },

  // GET /api/moderator/tracking — Lifetime Tracking list
  getTracking: async (req, res) => {
    try {
      const approved = await Application.getApprovedForModerator(req.session.userId);
      res.json(approved);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not load tracking.' });
    }
  },

  // GET /api/moderator/tracking/:id — now also includes guardian info and
  // the full history of tracking meetings (with guardian reports) for
  // this case, which is the actual point of the Lifetime Tracking tab.
  getTrackingById: async (req, res) => {
    try {
      const record = await Application.getApprovedByIdForModerator(req.params.id, req.session.userId);
      if (!record) return res.status(404).json({ error: 'Not found or not assigned to you.' });

      const [[guardian]] = await db.query(
        `SELECT g.LG_ID, g.name AS guardian_name, g.email AS guardian_email
         FROM applications ap JOIN guardian_info g ON ap.LG_ID = g.LG_ID
         WHERE ap.application_id = ?`,
        [req.params.id]
      );

      const meetings = await TrackingMeeting.getForApplication(req.params.id, req.session.userId);

      res.json({ ...record, guardian_name: guardian?.guardian_name, guardian_email: guardian?.guardian_email, meetings });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not load record.' });
    }
  },

  // POST /api/moderator/tracking/arrange  { application_id, meeting_date, meeting_time }
  // No participant picker needed — adopter and guardian are already fixed
  // by the approved application itself.
  arrangeTrackingMeeting: async (req, res) => {
    try {
      const { application_id, meeting_date, meeting_time } = req.body;
      if (!application_id) return res.status(400).json({ error: 'application_id is required.' });

      const record = await Application.getApprovedByIdForModerator(application_id, req.session.userId);
      if (!record) return res.status(404).json({ error: 'Not found or not assigned to you.' });

      const tracking_meeting_id = await TrackingMeeting.create(application_id, req.session.userId, meeting_date, meeting_time);
      res.status(201).json({ message: 'Tracking meeting arranged.', tracking_meeting_id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not arrange tracking meeting.' });
    }
  }

};

module.exports = moderatorController;
