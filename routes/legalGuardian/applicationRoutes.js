const express = require('express');
const router = express.Router();
const applicationController = require('../../controllers/legalGuardian/applicationController');
const { requireRole, requireVerified } = require('../../middleware/auth');

router.use(requireRole('legalGuardian'), requireVerified);

router.get('/new-requests', applicationController.getNewRequests);
router.post('/select-favorite', applicationController.selectFavorite);
router.post('/reject', applicationController.reject);
router.get('/:id', applicationController.getApplicantById);

module.exports = router;
