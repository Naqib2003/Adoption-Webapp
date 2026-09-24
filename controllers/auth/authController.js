const bcrypt = require('bcrypt');
const { lookupUsername } = require('../../models/shared/usernameRegistry');
const Adopter = require('../../models/adopter/adopterModel');
const LegalGuardian = require('../../models/legalGuardian/legalGuardianModel');
const LegalEntity = require('../../models/legalEntity/legalEntityModel');
const Moderator = require('../../models/moderator/moderatorModel');

const authController = {

  // POST /api/auth/login — the frontend sends ONLY username + password, no
  // account type. One lookup in the central `usernames` registry tells us
  // which table and which row to check — that's the whole trick.
  login: async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required.' });
      }

      const entry = await lookupUsername(username);
      if (!entry) {
        return res.status(401).json({ error: 'Invalid username or password.' });
      }

      let account;
      const role = entry.account_type; // 'adopter' | 'legalGuardian' | 'police' | 'lawyer' | 'moderator'

      if (role === 'adopter') {
        account = await Adopter.findById(entry.account_id);
      } else if (role === 'legalGuardian') {
        account = await LegalGuardian.findById(entry.account_id);
      } else if (role === 'police' || role === 'lawyer') {
        account = await LegalEntity.findById(entry.account_id);
      } else if (role === 'moderator') {
        account = await Moderator.findById(entry.account_id);
      }

      if (!account) {
        return res.status(401).json({ error: 'Invalid username or password.' });
      }

      const match = await bcrypt.compare(password, account.password_hash);
      if (!match) {
        return res.status(401).json({ error: 'Invalid username or password.' });
      }

      req.session.userId = entry.account_id;
      req.session.userRole = role;
      if (role === 'adopter' || role === 'legalGuardian') {
        req.session.verified = account.verification_status === 'verified';
      }

      res.json({
        message: 'Logged in.',
        role,
        verification_status: account.verification_status // undefined for police/lawyer — that's fine
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Login failed.' });
    }
  },

  // POST /api/auth/logout — identical regardless of role
  logout: (req, res) => {
    req.session.destroy(() => res.json({ message: 'Logged out.' }));
  }

};

module.exports = authController;
