const TrackingMeeting = require('../../models/tracking/trackingMeetingModel');

const trackingController = {

  // GET /api/legal-guardian/tracking-meetings — Assigned Meetings tab
  getMeetings: async (req, res) => {
    try {
      const meetings = await TrackingMeeting.getForGuardian(req.session.userId);
      res.json(meetings);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not load meetings.' });
    }
  },

  // GET /api/legal-guardian/tracking-meetings/:id
  getMeetingById: async (req, res) => {
    try {
      const meeting = await TrackingMeeting.getByIdForGuardian(req.params.id, req.session.userId);
      if (!meeting) return res.status(404).json({ error: 'Not found.' });
      res.json(meeting);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not load meeting.' });
    }
  },

  // POST /api/legal-guardian/tracking-meetings/complete  { tracking_meeting_id, report }
  complete: async (req, res) => {
    try {
      const { tracking_meeting_id, report } = req.body;
      if (!tracking_meeting_id) return res.status(400).json({ error: 'tracking_meeting_id is required.' });
      if (!report || !report.trim()) {
        return res.status(400).json({ error: 'A report on the adoptee\'s current condition is required.' });
      }
      const success = await TrackingMeeting.complete(tracking_meeting_id, req.session.userId, report.trim());
      if (!success) return res.status(403).json({ error: 'This meeting is not yours, or has already been completed.' });
      res.json({ message: 'Meeting marked as done. Report saved.' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not complete meeting.' });
    }
  }

};

module.exports = trackingController;
