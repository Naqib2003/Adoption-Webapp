const { Application } = require('../../models/application/applicationModel');
const Adoptee = require('../../models/adoptee/adopteeModel');
const db = require('../../config/db');

const applicationController = {

  // POST /api/adopter/applications/apply  { AE_ID }
  apply: async (req, res) => {
    try {
      const AR_ID = req.session.userId;
      const AE_ID = req.body.AE_ID;
      if (!AE_ID) return res.status(400).json({ error: 'AE_ID is required.' });

      const adoptee = await Adoptee.getAvailableById(AE_ID);
      if (!adoptee) {
        return res.status(404).json({ error: 'This adoptee is not available for application.' });
      }

      const already = await Application.hasApplied(AR_ID, AE_ID);
      if (already) {
        return res.status(409).json({ error: 'You have already applied to this adoptee.' });
      }

      // Look up which guardian currently owns this adoptee
      const [rows] = await db.query('SELECT LG_ID FROM adoptee_info WHERE AE_ID = ?', [AE_ID]);
      const LG_ID = rows[0].LG_ID;

      const application_id = await Application.apply(AR_ID, AE_ID, LG_ID);
      res.status(201).json({ message: 'Application submitted. Awaiting the guardian\'s review.', application_id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not submit application.' });
    }
  },

  // GET /api/adopter/applications/mine
  getMine: async (req, res) => {
    try {
      const applications = await Application.getMineByAdopter(req.session.userId);
      res.json(applications);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not load your applications.' });
    }
  }

};

module.exports = applicationController;
