const express = require('express');
const router = express.Router();
const adopterController = require('../../controllers/adopter/adopterController');
const { requireRole, requireVerified } = require('../../middleware/auth');

// Public — anyone can sign up or log in as an adopter
router.post('/signup', adopterController.signup);
router.post('/login', adopterController.login);
router.post('/logout', adopterController.logout);

// Protected — must be logged in AND have role 'adopter'
// (viewing/editing your OWN profile doesn't require verification, so no requireVerified here)
router.get('/profile', requireRole('adopter'), adopterController.getProfile);
router.put('/profile', requireRole('adopter'), adopterController.updateProfile);

// Only reachable once verified — powers the enhanced adopter-only pages
router.get('/dashboard', requireRole('adopter'), requireVerified, adopterController.getDashboard);

// Matching preferences — same access level as viewing/editing your own
// profile, doesn't require verification
router.get('/preferences', requireRole('adopter'), adopterController.getPreferences);
router.put('/preferences', requireRole('adopter'), adopterController.updatePreferences);

// Example of a future adopter-only page that DOES require verification:
// router.get('/browse-adoptees', requireRole('adopter'), requireVerified, adopteeController.browse);

module.exports = router;
