const { Application } = require('../../models/application/applicationModel');
const Meeting = require('../../models/meeting/meetingModel');
const LegalEntity = require('../../models/legalEntity/legalEntityModel');

const lawyerController = {

  // GET /api/lawyer/dashboard — used by the guard script + for greeting
  getDashboard: async (req, res) => {
    try {
      const lawyer = await LegalEntity.findById(req.session.userId);
      if (!lawyer) return res.status(404).json({ error: 'Not found.' });
      res.json({ name: lawyer.name });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not load dashboard.' });
    }
  },

  // GET /api/lawyer/meetings — Meetings tab
  getMeetings: async (req, res) => {
    try {
      const meetings = await Meeting.getForLawyer(req.session.userId);
      res.json(meetings);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not load meetings.' });
    }
  },

  // GET /api/lawyer/meetings/:id
  getMeetingById: async (req, res) => {
    try {
      const meeting = await Meeting.getByIdForLawyer(req.params.id, req.session.userId);
      if (!meeting) return res.status(404).json({ error: 'Not found.' });
      res.json(meeting);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not load meeting.' });
    }
  },

  // GET /api/lawyer/approval-requests — Adoption Approval Requests tab
  getApprovalRequests: async (req, res) => {
    try {
      const requests = await Application.getPendingForLawyer(req.session.userId);
      res.json(requests);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not load approval requests.' });
    }
  },

  // GET /api/lawyer/approval-requests/:id
  getApprovalRequestById: async (req, res) => {
    try {
      const request = await Application.getPendingByIdForLawyer(req.params.id, req.session.userId);
      if (!request) return res.status(404).json({ error: 'Not found or not assigned to you.' });
      res.json(request);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not load request.' });
    }
  },

  // POST /api/lawyer/decide  { application_id, status }
  decide: async (req, res) => {
    try {
      const { application_id, status } = req.body;
      if (!application_id || !['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'application_id and a valid status (approved/rejected) are required.' });
      }
      const success = await Application.decideByLawyer(application_id, req.session.userId, status);
      if (!success) return res.status(403).json({ error: 'This case is not assigned to you or already decided.' });
      res.json({ message: `Application marked as ${status}.` });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Decision failed.' });
    }
  },

  // GET /api/lawyer/approved — Approved Adoptees tab
  getApproved: async (req, res) => {
    try {
      const approved = await Application.getApprovedForLawyer(req.session.userId);
      res.json(approved);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not load approved adoptees.' });
    }
  },

  // GET /api/lawyer/approved/:id
  getApprovedById: async (req, res) => {
    try {
      const record = await Application.getApprovedByIdForLawyer(req.params.id, req.session.userId);
      if (!record) return res.status(404).json({ error: 'Not found or not assigned to you.' });
      res.json(record);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not load record.' });
    }
  }

};

module.exports = lawyerController;
