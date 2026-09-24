const express = require('express');
const router = express.Router();
const trackingController = require('../../controllers/legalGuardian/trackingController');
const { requireRole, requireVerified } = require('../../middleware/auth');

router.use(requireRole('legalGuardian'), requireVerified);

router.get('/tracking-meetings', trackingController.getMeetings);
router.get('/tracking-meetings/:id', trackingController.getMeetingById);
router.post('/tracking-meetings/complete', trackingController.complete);

module.exports = router;
