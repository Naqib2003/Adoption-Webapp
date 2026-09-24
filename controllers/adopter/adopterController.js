const bcrypt = require('bcrypt');
const Adopter = require('../../models/adopter/adopterModel');
const Preferences = require('../../models/adopter/preferencesModel');
const { isUsernameTaken, registerUsername } = require('../../models/shared/usernameRegistry');

const adopterController = {

  // POST /api/adopter/signup
  signup: async (req, res) => {
    try {
      const { name, nid_no, dob, religion, gender, profession, email, username, password,
              house_no, street, zipcode, city_village, district, phone,
              s_name, s_nid, s_dob, s_phone, s_gender, s_religion, s_profession,
              has_prior_adoption_experience, prior_adoption_experience_description } = req.body;

      if (!name || !email || !username || !password || !nid_no || !dob || !gender) {
        return res.status(400).json({ error: 'Missing required fields.' });
      }
      if (!phone || !house_no || !street || !city_village || !district || !religion || !profession) {
        return res.status(400).json({ error: 'Phone, religion, profession, and a full address are required.' });
      }
      if (has_prior_adoption_experience && !prior_adoption_experience_description) {
        return res.status(400).json({ error: 'Please describe your previous adoption experience.' });
      }

      const existingEmail = await Adopter.findByEmail(email);
      if (existingEmail) {
        return res.status(409).json({ error: 'An account with this email already exists.' });
      }

      // Reserve the username FIRST, before creating the account row. If this
      // succeeds but the account creation below fails, you'd be left with a
      // registered username pointing at nothing — rare, and recoverable by
      // deleting that row from `usernames` — but worth knowing this isn't
      // wrapped in a database transaction.
      const taken = await isUsernameTaken(username);
      if (taken) {
        return res.status(409).json({ error: 'That username is already taken.' });
      }

      const password_hash = await bcrypt.hash(password, 10);
      const AR_ID = await Adopter.create({
        name, nid_no, dob, religion, gender, profession, email, username, password_hash,
        has_prior_adoption_experience, prior_adoption_experience_description
      });

      await registerUsername(username, 'adopter', AR_ID);

      if (house_no || street || zipcode || city_village || district) {
        await Adopter.upsertAddress(AR_ID, { house_no, street, zipcode, city_village, district });
      }
      if (phone) {
        await Adopter.addPhone(AR_ID, phone);
      }
      // Spouse is entirely optional — only create a record if the applicant
      // actually filled in the two fields that matter (name + NID, since
      // NID is the spouse table's primary key and can't be blank).
      if (s_name && s_nid) {
        await Adopter.addSpouse(AR_ID, {
          s_name, s_nid, s_dob, phone: s_phone, gender: s_gender, religion: s_religion, profession: s_profession
        });
      }

      req.session.userId = AR_ID;
      req.session.userRole = 'adopter';
      req.session.verified = false; // new accounts always start unverified

      res.status(201).json({
        message: 'Account created. Your profile must be verified by a Legal Entity before you can browse or apply.',
        AR_ID,
        role: 'adopter',
        verification_status: 'pending'
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Signup failed.' });
    }
  },

  // POST /api/adopter/login
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required.' });
      }

      const adopter = await Adopter.findByEmail(email);
      if (!adopter) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const match = await bcrypt.compare(password, adopter.password_hash);
      if (!match) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      req.session.userId = adopter.AR_ID;
      req.session.userRole = 'adopter';
      req.session.verified = adopter.verification_status === 'verified';

      res.json({
        message: 'Logged in.',
        AR_ID: adopter.AR_ID,
        role: 'adopter',
        verification_status: adopter.verification_status
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Login failed.' });
    }
  },

  // POST /api/adopter/logout
  logout: (req, res) => {
    req.session.destroy(() => {
      res.json({ message: 'Logged out.' });
    });
  },

  // GET /api/adopter/profile  (requireRole('adopter') applied in routes)
  getProfile: async (req, res) => {
    try {
      const profile = await Adopter.getFullProfile(req.session.userId);
      if (!profile) {
        return res.status(404).json({ error: 'Profile not found.' });
      }
      delete profile.password_hash;
      res.json(profile);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not load profile.' });
    }
  },

  // PUT /api/adopter/profile  (requireRole('adopter') applied in routes)
  updateProfile: async (req, res) => {
    try {
      const AR_ID = req.session.userId;
      const { name, religion, profession, age, house_no, street, zipcode, city_village, district } = req.body;

      await Adopter.updateProfile(AR_ID, { name, religion, profession, age });

      if (house_no || street || zipcode || city_village || district) {
        await Adopter.upsertAddress(AR_ID, { house_no, street, zipcode, city_village, district });
      }

      const updated = await Adopter.getFullProfile(AR_ID);
      delete updated.password_hash;
      res.json({ message: 'Profile updated.', profile: updated });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Update failed.' });
    }
  },

  // GET /api/adopter/dashboard  (requireRole('adopter') + requireVerified applied in routes)
  // Only reachable once the adopter is verified — used by adopter-home.html
  // to greet them by name, and by every other adopter-only page as a guard.
  getDashboard: async (req, res) => {
    try {
      const adopter = await Adopter.findById(req.session.userId);
      if (!adopter) {
        return res.status(404).json({ error: 'Not found.' });
      }
      res.json({ name: adopter.name });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not load dashboard.' });
    }
  },

  // GET /api/adopter/preferences
  getPreferences: async (req, res) => {
    try {
      const prefs = await Preferences.get(req.session.userId);
      res.json(prefs || { preferred_age_min: null, preferred_age_max: null, preferred_gender: 'any', open_to_special_needs: false });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not load preferences.' });
    }
  },

  // PUT /api/adopter/preferences
  updatePreferences: async (req, res) => {
    try {
      await Preferences.upsert(req.session.userId, req.body);
      res.json({ message: 'Matching preferences saved.' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not save preferences.' });
    }
  }

};

module.exports = adopterController;
