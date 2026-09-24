const { Application } = require('../../models/application/applicationModel');
const Report = require('../../models/police/reportModel');

const applicationController = {

  getNewRequests: async (req, res) => {
    try {
      const requests = await Application.getNewRequestsForGuardian(req.session.userId);

      const grouped = {};
      for (const row of requests) {
        if (!grouped[row.AE_ID]) {
          grouped[row.AE_ID] = {
            AE_ID: row.AE_ID,
            adoptee_name: row.adoptee_name,
            adoptee_type: row.adoptee_type,
            applicants: []
          };
        }
        grouped[row.AE_ID].applicants.push({
          application_id: row.application_id,
          AR_ID: row.AR_ID,
          adopter_name: row.adopter_name,
          adopter_email: row.adopter_email,
          has_prior_adoption_experience: !!row.has_prior_adoption_experience,
          applied_at: row.applied_at
        });
      }

      res.json(Object.values(grouped));
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not load new requests.' });
    }
  },

  selectFavorite: async (req, res) => {
    try {
      const success = await Application.selectFavorite(req.body.application_id, req.session.userId);
      if (!success) return res.status(404).json({ error: 'Application not found or already decided.' });
      res.json({ message: 'Favorite selected. Other applicants for this adoptee have been rejected, and this case now moves to a Moderator.' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not select favorite.' });
    }
  },

  reject: async (req, res) => {
    try {
      const success = await Application.rejectByGuardian(req.body.application_id, req.session.userId);
      if (!success) return res.status(404).json({ error: 'Application not found or already decided.' });
      res.json({ message: 'Application rejected.' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not reject application.' });
    }
  },

  // GET /api/legal-guardian/applications/:id — single applicant's full
  // detail, now including the police verification report for that adopter
  // (from ANY officer — the guardian just needs to know what was found).
  getApplicantById: async (req, res) => {
    try {
      const applicant = await Application.getApplicantDetailForGuardian(req.params.id, req.session.userId);
      if (!applicant) return res.status(404).json({ error: 'Not found.' });
      const policeReport = await Report.getLatestForAdopter(applicant.AR_ID);
      res.json({ ...applicant, policeReport: policeReport ? policeReport.report_text : null });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not load applicant.' });
    }
  }

};

module.exports = applicationController;
