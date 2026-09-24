const bcrypt = require('bcrypt');
const LegalGuardian = require('../../models/legalGuardian/legalGuardianModel');
const { isUsernameTaken, registerUsername } = require('../../models/shared/usernameRegistry');

const legalGuardianController = {

  // POST /api/legal-guardian/signup
  signup: async (req, res) => {
    try {
      const { name, nid_no, dob, religion, gender, profession, email, username, password,
              house_no, street, zipcode, city_village, district, phone } = req.body;

      if (!name || !email || !username || !password || !nid_no || !dob || !gender) {
        return res.status(400).json({ error: 'Missing required fields.' });
      }
      if (!phone || !religion || !profession || !house_no || !street || !city_village || !district) {
        return res.status(400).json({ error: 'Phone, religion, profession, and a full address are all required for a Legal Guardian account.' });
      }

      const existingEmail = await LegalGuardian.findByEmail(email);
      if (existingEmail) {
        return res.status(409).json({ error: 'An account with this email already exists.' });
      }

      const taken = await isUsernameTaken(username);
      if (taken) {
        return res.status(409).json({ error: 'That username is already taken.' });
      }

      const password_hash = await bcrypt.hash(password, 10);
      const LG_ID = await LegalGuardian.create({
        name, nid_no, dob, religion, gender, profession, email, username, password_hash
      });

      await registerUsername(username, 'legalGuardian', LG_ID);

      if (house_no || street || zipcode || city_village || district) {
        await LegalGuardian.upsertAddress(LG_ID, { house_no, street, zipcode, city_village, district });
      }
      if (phone) {
        await LegalGuardian.addPhone(LG_ID, phone);
      }

      req.session.userId = LG_ID;
      req.session.userRole = 'legalGuardian';
      req.session.verified = false; // new accounts always start unverified

      res.status(201).json({
        message: 'Account created. Your profile must be verified by a Legal Entity before it is fully active.',
        LG_ID,
        role: 'legalGuardian',
        verification_status: 'pending'
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Signup failed.' });
    }
  },

  // POST /api/legal-guardian/login
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required.' });
      }

      const guardian = await LegalGuardian.findByEmail(email);
      if (!guardian) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const match = await bcrypt.compare(password, guardian.password_hash);
      if (!match) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      req.session.userId = guardian.LG_ID;
      req.session.userRole = 'legalGuardian';
      req.session.verified = guardian.verification_status === 'verified';

      res.json({
        message: 'Logged in.',
        LG_ID: guardian.LG_ID,
        role: 'legalGuardian',
        verification_status: guardian.verification_status
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Login failed.' });
    }
  },

  // POST /api/legal-guardian/logout
  logout: (req, res) => {
    req.session.destroy(() => res.json({ message: 'Logged out.' }));
  },

  // GET /api/legal-guardian/profile
  getProfile: async (req, res) => {
    try {
      const profile = await LegalGuardian.getFullProfile(req.session.userId);
      if (!profile) return res.status(404).json({ error: 'Profile not found.' });
      delete profile.password_hash;
      res.json(profile);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not load profile.' });
    }
  },

  // PUT /api/legal-guardian/profile
  updateProfile: async (req, res) => {
    try {
      const LG_ID = req.session.userId;
      const { name, religion, profession, age, house_no, street, zipcode, city_village, district } = req.body;

      await LegalGuardian.updateProfile(LG_ID, { name, religion, profession, age });

      if (house_no || street || zipcode || city_village || district) {
        await LegalGuardian.upsertAddress(LG_ID, { house_no, street, zipcode, city_village, district });
      }

      const updated = await LegalGuardian.getFullProfile(LG_ID);
      delete updated.password_hash;
      res.json({ message: 'Profile updated.', profile: updated });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Update failed.' });
    }
  },

  // GET /api/legal-guardian/dashboard  (requireRole + requireVerified applied in routes)
  // Only reachable once the guardian is verified — used by guardian-home.html
  // to greet them by name, and by every other guardian-only page as a guard.
  getDashboard: async (req, res) => {
    try {
      const guardian = await LegalGuardian.findById(req.session.userId);
      if (!guardian) {
        return res.status(404).json({ error: 'Not found.' });
      }
      res.json({ name: guardian.name });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not load dashboard.' });
    }
  }

};

module.exports = legalGuardianController;
