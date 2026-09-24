const bcrypt = require('bcrypt');
const LegalEntity = require('../../models/legalEntity/legalEntityModel');
const { isUsernameTaken, registerUsername } = require('../../models/shared/usernameRegistry');

const legalEntityController = {

  // POST /api/legal-entity/signup
  signup: async (req, res) => {
    try {
      const { name, nid_no, dob, gender, phone_no, email, username, password,
              entity_type, badge_no, license_no } = req.body;

      if (!name || !email || !username || !password || !nid_no || !dob || !gender || !entity_type) {
        return res.status(400).json({ error: 'Missing required fields.' });
      }
      if (!phone_no) {
        return res.status(400).json({ error: 'Phone number is required.' });
      }

      if (!['police', 'lawyer'].includes(entity_type)) {
        return res.status(400).json({ error: "entity_type must be 'police' or 'lawyer'." });
      }

      if (entity_type === 'police' && !badge_no) {
        return res.status(400).json({ error: 'Badge number is required for police.' });
      }
      if (entity_type === 'lawyer' && !license_no) {
        return res.status(400).json({ error: 'License number is required for lawyers.' });
      }

      const existingEmail = await LegalEntity.findByEmail(email);
      if (existingEmail) {
        return res.status(409).json({ error: 'An account with this email already exists.' });
      }

      const taken = await isUsernameTaken(username);
      if (taken) {
        return res.status(409).json({ error: 'That username is already taken.' });
      }

      const password_hash = await bcrypt.hash(password, 10);
      const LE_ID = await LegalEntity.create({
        name, nid_no, dob, gender, phone_no, email, username, entity_type, badge_no, license_no, password_hash
      });

      // account_type in the registry matches the session role directly
      // ('police' or 'lawyer'), not a generic 'legalEntity'.
      await registerUsername(username, entity_type, LE_ID);

      // The specific role stored is 'police' or 'lawyer' — not the generic
      // 'legalEntity' — because their permissions differ (police verify
      // family profiles, lawyers approve adoptions).
      req.session.userId = LE_ID;
      req.session.userRole = entity_type;

      res.status(201).json({ message: 'Account created.', LE_ID, role: entity_type });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Signup failed.' });
    }
  },

  // POST /api/legal-entity/login
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required.' });
      }

      const entity = await LegalEntity.findByEmail(email);
      if (!entity) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const match = await bcrypt.compare(password, entity.password_hash);
      if (!match) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      req.session.userId = entity.LE_ID;
      req.session.userRole = entity.entity_type; // 'police' or 'lawyer'

      res.json({ message: 'Logged in.', LE_ID: entity.LE_ID, role: entity.entity_type });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Login failed.' });
    }
  },

  // POST /api/legal-entity/logout
  logout: (req, res) => {
    req.session.destroy(() => res.json({ message: 'Logged out.' }));
  },

  // GET /api/legal-entity/profile
  getProfile: async (req, res) => {
    try {
      const profile = await LegalEntity.findById(req.session.userId);
      if (!profile) return res.status(404).json({ error: 'Profile not found.' });
      delete profile.password_hash;
      res.json(profile);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not load profile.' });
    }
  },

  // PUT /api/legal-entity/profile
  updateProfile: async (req, res) => {
    try {
      const LE_ID = req.session.userId;
      const { name, phone_no, age } = req.body;

      await LegalEntity.updateProfile(LE_ID, { name, phone_no, age });

      const updated = await LegalEntity.findById(LE_ID);
      delete updated.password_hash;
      res.json({ message: 'Profile updated.', profile: updated });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Update failed.' });
    }
  }

};

module.exports = legalEntityController;
