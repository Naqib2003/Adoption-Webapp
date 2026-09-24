const express = require('express');
const router = express.Router();
const donationController = require('../../controllers/legalGuardian/donationController');
const { requireRole, requireVerified } = require('../../middleware/auth');

router.use(requireRole('legalGuardian'), requireVerified);

router.get('/settings/:ae_id', donationController.getSettings);
router.put('/settings/:ae_id', donationController.updateSettings);
router.post('/wishlist', donationController.createWishlistItem);
router.get('/wishlist', donationController.getMyWishlist);

module.exports = router;
