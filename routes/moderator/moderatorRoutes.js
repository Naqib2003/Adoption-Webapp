const express = require('express');
const router = express.Router();
const moderatorController = require('../../controllers/moderator/moderatorController');
const { requireRole } = require('../../middleware/auth');

router.use(requireRole('moderator'));

router.get('/dashboard', moderatorController.getDashboard);
router.get('/adoptees', moderatorController.getAdoptees);
router.get('/adoptees/:id', moderatorController.getAdopteeById);
router.get('/lawyers', moderatorController.getFreeLawyers);
router.get('/lawyers/:id', moderatorController.getLawyerById);
router.post('/arrange-meeting', moderatorController.arrangeMeeting);
router.get('/tracking', moderatorController.getTracking);
router.get('/tracking/:id', moderatorController.getTrackingById);
router.post('/tracking/arrange', moderatorController.arrangeTrackingMeeting);

module.exports = router;
