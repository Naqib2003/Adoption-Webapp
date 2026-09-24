const express = require('express');
const router = express.Router();
const browseController = require('../../controllers/adopter/browseController');
const { requireRole, requireVerified } = require('../../middleware/auth');

// Must be a verified adopter to browse
router.use(requireRole('adopter'), requireVerified);

router.get('/available', browseController.getAvailable);
router.get('/:id', browseController.getById);

module.exports = router;
