const express = require('express');
const router = express.Router();
const legalEntityController = require('../../controllers/legalEntity/legalEntityController');
const { requireRole } = require('../../middleware/auth');

router.post('/signup', legalEntityController.signup);
router.post('/login', legalEntityController.login);
router.post('/logout', legalEntityController.logout);

// Either police OR lawyer can view/edit their own profile
router.get('/profile', requireRole('police', 'lawyer'), legalEntityController.getProfile);
router.put('/profile', requireRole('police', 'lawyer'), legalEntityController.updateProfile);

module.exports = router;
