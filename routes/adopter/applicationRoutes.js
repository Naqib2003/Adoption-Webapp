const express = require('express');
const router = express.Router();
const applicationController = require('../../controllers/adopter/applicationController');
const { requireRole, requireVerified } = require('../../middleware/auth');

router.use(requireRole('adopter'), requireVerified);

router.post('/apply', applicationController.apply);
router.get('/mine', applicationController.getMine);

module.exports = router;
