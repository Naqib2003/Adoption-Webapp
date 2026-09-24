const express = require('express');
const router = express.Router();
const publicDonationController = require('../../controllers/donation/publicDonationController');

// Deliberately NO requireRole/requireAuth here — this is the public
// donation page, reachable by visitors, adopters, anyone.
router.get('/eligible-adoptees', publicDonationController.getEligibleAdoptees);
router.get('/eligible-adoptees/:id', publicDonationController.getEligibleAdopteeById);
router.get('/wishlist', publicDonationController.getWishlist);
router.get('/wishlist/:id', publicDonationController.getWishlistById);
router.get('/whoami', publicDonationController.whoami);
router.post('/donate-money', publicDonationController.donateMoney);
router.post('/fulfill-wishlist', publicDonationController.fulfillWishlist);

module.exports = router;
