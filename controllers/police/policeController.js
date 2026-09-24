const Police = require('../../models/police/policeModel');
const Report = require('../../models/police/reportModel');
const Adoptee = require('../../models/adoptee/adopteeModel');
const Adopter = require('../../models/adopter/adopterModel');
const LegalGuardian = require('../../models/legalGuardian/legalGuardianModel');

const policeController = {

  // GET /api/police/dashboard
  getDashboard: async (req, res) => {
    try {
      res.json({ role: req.session.userRole });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not load dashboard.' });
    }
  },

  // GET /api/police/pending-adopters — only THIS officer's assigned cases
  getPendingAdopters: async (req, res) => {
    try {
      const adopters = await Police.getPendingAdopters(req.session.userId);
      res.json(adopters);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not load pending adopters.' });
    }
  },

  // GET /api/police/pending-guardians — only THIS officer's assigned cases
  getPendingGuardians: async (req, res) => {
    try {
      const guardians = await Police.getPendingGuardians(req.session.userId);
      res.json(guardians);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not load pending guardians.' });
    }
  },

  // GET /api/police/pending-adoptees — only THIS officer's assigned cases
  getPendingAdoptees: async (req, res) => {
    try {
      const adoptees = await Adoptee.getPendingForPolice(req.session.userId);
      res.json(adoptees);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not load pending adoptees.' });
    }
  },

  // POST /api/police/verify-adopter  { AR_ID, status, report }
  verifyAdopter: async (req, res) => {
    try {
      const { AR_ID, status, report } = req.body;
      if (!AR_ID || !['verified', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'AR_ID and a valid status (verified/rejected) are required.' });
      }
      if (!report || !report.trim()) {
        return res.status(400).json({ error: 'A report is required before you can verify or reject an adopter.' });
      }
      const success = await Police.verifyAdopter(AR_ID, status, req.session.userId);
      if (!success) {
        return res.status(403).json({ error: 'This case is not assigned to you.' });
      }
      await Report.create(AR_ID, req.session.userId, report.trim());
      res.json({ message: `Adopter #${AR_ID} marked as ${status}.` });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Verification failed.' });
    }
  },

  // POST /api/police/verify-guardian  { LG_ID, status, report }
  verifyGuardian: async (req, res) => {
    try {
      const { LG_ID, status, report } = req.body;
      if (!LG_ID || !['verified', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'LG_ID and a valid status (verified/rejected) are required.' });
      }
      if (!report || !report.trim()) {
        return res.status(400).json({ error: 'A report is required before you can verify or reject a legal guardian.' });
      }
      const success = await Police.verifyGuardian(LG_ID, status, req.session.userId);
      if (!success) {
        return res.status(403).json({ error: 'This case is not assigned to you.' });
      }
      await Report.createForGuardian(LG_ID, req.session.userId, report.trim());
      res.json({ message: `Legal Guardian #${LG_ID} marked as ${status}.` });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Verification failed.' });
    }
  },

  // POST /api/police/verify-adoptee  { AE_ID, status, report }
  verifyAdoptee: async (req, res) => {
    try {
      const { AE_ID, status, report } = req.body;
      if (!AE_ID || !['verified', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'AE_ID and a valid status (verified/rejected) are required.' });
      }
      if (!report || !report.trim()) {
        return res.status(400).json({ error: 'A report is required before you can verify or reject an adoptee.' });
      }
      const success = await Adoptee.verifyAdoptee(AE_ID, status, req.session.userId);
      if (!success) {
        return res.status(403).json({ error: 'This case is not assigned to you.' });
      }
      await Report.createForAdoptee(AE_ID, req.session.userId, report.trim());
      res.json({ message: `Adoptee #${AE_ID} marked as ${status}.` });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Verification failed.' });
    }
  },

  // GET /api/police/adopters/:id — one adopter's full detail, own case only
  getAdopterById: async (req, res) => {
    try {
      const adopter = await Adopter.getByIdForPolice(req.params.id, req.session.userId);
      if (!adopter) return res.status(404).json({ error: 'Not found or not assigned to you.' });
      const existingReport = await Report.getLatestForAdopterByPolice(req.params.id, req.session.userId);
      res.json({ ...adopter, existingReport: existingReport ? existingReport.report_text : null });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not load adopter.' });
    }
  },

  // GET /api/police/guardians/:id — one guardian's full detail, own case only
  getGuardianById: async (req, res) => {
    try {
      const guardian = await LegalGuardian.getByIdForPolice(req.params.id, req.session.userId);
      if (!guardian) return res.status(404).json({ error: 'Not found or not assigned to you.' });
      const existingReport = await Report.getLatestForGuardianByPolice(req.params.id, req.session.userId);
      res.json({ ...guardian, existingReport: existingReport ? existingReport.report_text : null });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not load guardian.' });
    }
  },

  // GET /api/police/adoptees/:id — one adoptee's full detail, own case only
  getAdopteeById: async (req, res) => {
    try {
      const adoptee = await Adoptee.getPendingForPoliceById(req.params.id, req.session.userId);
      if (!adoptee) return res.status(404).json({ error: 'Not found or not assigned to you.' });
      const existingReport = await Report.getLatestForAdopteeByPolice(req.params.id, req.session.userId);
      res.json({ ...adoptee, existingReport: existingReport ? existingReport.report_text : null });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not load adoptee.' });
    }
  }

};

module.exports = policeController;
