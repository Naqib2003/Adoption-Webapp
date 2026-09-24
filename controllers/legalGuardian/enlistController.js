const Adoptee = require('../../models/adoptee/adopteeModel');

const enlistController = {

  enlist: async (req, res) => {
    try {
      const { name, dob, religion, gender, profession, email, adoptee_type,
              house_no, street, zipcode, city_village, district,
              nid_no, prev_med_record, profession_history, phone,
              birth_cert, special_needs } = req.body;

      if (!name || !dob || !gender || !adoptee_type || !religion) {
        return res.status(400).json({ error: 'Name, date of birth, gender, religion, and type are required.' });
      }
      if (!['elderly', 'child'].includes(adoptee_type)) {
        return res.status(400).json({ error: "adoptee_type must be 'elderly' or 'child'." });
      }
      if (!house_no || !street || !city_village || !district) {
        return res.status(400).json({ error: 'A full address is required (house no., street, city/village, district).' });
      }
      if (adoptee_type === 'elderly') {
        if (!profession || !nid_no || !phone) {
          return res.status(400).json({ error: 'For an elderly adoptee, profession, NID number, and phone are required.' });
        }
      }
      if (adoptee_type === 'child') {
        if (!birth_cert) {
          return res.status(400).json({ error: 'For a child adoptee, a birth certificate number is required.' });
        }
      }

      const AE_ID = await Adoptee.create(req.session.userId, {
        name, dob, religion, gender, profession, email, adoptee_type,
        house_no, street, zipcode, city_village, district,
        nid_no, prev_med_record, profession_history, phone,
        birth_cert, special_needs
      });

      res.status(201).json({ message: 'Enlistment submitted. Awaiting police verification.', AE_ID });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Enlistment failed.' });
    }
  },

  // POST /api/legal-guardian/adoptees/reapply — edits a REJECTED
  // enlistment in place and resubmits it, instead of creating a new one
  // (which is what was causing the duplicate-key error).
  reapply: async (req, res) => {
    try {
      const { AE_ID, name, dob, religion, gender, profession, email, adoptee_type,
              house_no, street, zipcode, city_village, district,
              nid_no, prev_med_record, profession_history, phone,
              birth_cert, special_needs } = req.body;

      if (!AE_ID || !name || !dob || !gender || !adoptee_type || !religion) {
        return res.status(400).json({ error: 'Name, date of birth, gender, religion, and type are required.' });
      }
      if (!['elderly', 'child'].includes(adoptee_type)) {
        return res.status(400).json({ error: "adoptee_type must be 'elderly' or 'child'." });
      }
      if (!house_no || !street || !city_village || !district) {
        return res.status(400).json({ error: 'A full address is required (house no., street, city/village, district).' });
      }
      if (adoptee_type === 'elderly' && (!profession || !nid_no || !phone)) {
        return res.status(400).json({ error: 'For an elderly adoptee, profession, NID number, and phone are required.' });
      }
      if (adoptee_type === 'child' && !birth_cert) {
        return res.status(400).json({ error: 'For a child adoptee, a birth certificate number is required.' });
      }

      const success = await Adoptee.reapply(AE_ID, req.session.userId, {
        name, dob, religion, gender, profession, email, adoptee_type,
        house_no, street, zipcode, city_village, district,
        nid_no, prev_med_record, profession_history, phone,
        birth_cert, special_needs
      });

      if (!success) {
        return res.status(404).json({ error: 'Not found, not yours, or not currently rejected.' });
      }

      res.json({ message: 'Enlistment updated and resubmitted for verification.' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not resubmit enlistment.' });
    }
  },

  getPending: async (req, res) => {
    try {
      const pending = await Adoptee.getPendingByGuardian(req.session.userId);
      res.json(pending);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not load pending enlistments.' });
    }
  },

  getEnlistedChildren: async (req, res) => {
    try {
      const children = await Adoptee.getEnlistedByGuardian(req.session.userId, 'child');
      res.json(children);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not load enlisted children.' });
    }
  },

  getEnlistedElders: async (req, res) => {
    try {
      const elders = await Adoptee.getEnlistedByGuardian(req.session.userId, 'elderly');
      res.json(elders);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not load enlisted elders.' });
    }
  },

  getById: async (req, res) => {
    try {
      const adoptee = await Adoptee.getByIdForGuardian(req.params.id, req.session.userId);
      if (!adoptee) return res.status(404).json({ error: 'Not found.' });
      res.json(adoptee);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not load adoptee.' });
    }
  }

};

module.exports = enlistController;
