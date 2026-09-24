const express = require('express');
const router = express.Router();
const legalGuardianController = require('../../controllers/legalGuardian/legalGuardianController');
const { requireRole, requireVerified } = require('../../middleware/auth');

router.post('/signup', legalGuardianController.signup);
router.post('/login', legalGuardianController.login);
router.post('/logout', legalGuardianController.logout);

// Viewing/editing your OWN profile doesn't require verification
router.get('/profile', requireRole('legalGuardian'), legalGuardianController.getProfile);
router.put('/profile', requireRole('legalGuardian'), legalGuardianController.updateProfile);

// Only reachable once verified — powers the enhanced guardian-only pages
router.get('/dashboard', requireRole('legalGuardian'), requireVerified, legalGuardianController.getDashboard);

module.exports = router;
