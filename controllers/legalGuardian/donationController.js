const DonationSettings = require('../../models/donation/donationSettingsModel');
const Wishlist = require('../../models/donation/wishlistModel');

const donationController = {

  // GET /api/legal-guardian/donations/settings/:ae_id
  getSettings: async (req, res) => {
    try {
      const settings = await DonationSettings.getForGuardian(req.params.ae_id, req.session.userId);
      res.json(settings || { AE_ID: Number(req.params.ae_id), allow_donation: false, money_enabled: false, need_based_enabled: false, reason: '' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not load donation settings.' });
    }
  },

  // PUT /api/legal-guardian/donations/settings/:ae_id
  updateSettings: async (req, res) => {
    try {
      const result = await DonationSettings.upsert(req.params.ae_id, req.session.userId, req.body);
      if (!result.success) {
        if (result.reason === 'already_adopted') {
          return res.status(409).json({ error: 'This adoptee has already been successfully adopted — donation settings can no longer be changed.' });
        }
        return res.status(404).json({ error: 'Adoptee not found or not yours.' });
      }
      res.json({ message: 'Donation settings updated.' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not update settings.' });
    }
  },

  createWishlistItem: async (req, res) => {
    try {
      const { AE_ID, description } = req.body;
      if (!AE_ID || !description) {
        return res.status(400).json({ error: 'AE_ID and description are required.' });
      }
      const item_id = await Wishlist.create(AE_ID, req.session.userId, description);
      if (!item_id) return res.status(404).json({ error: 'Adoptee not found or not yours.' });
      res.status(201).json({ message: 'Wishlist request added.', item_id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not add wishlist request.' });
    }
  },

  getMyWishlist: async (req, res) => {
    try {
      const items = await Wishlist.getForGuardian(req.session.userId);
      res.json(items);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not load wishlist requests.' });
    }
  }

};

module.exports = donationController;
