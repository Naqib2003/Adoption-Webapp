const Donation = require('../../models/donation/donationModel');
const Wishlist = require('../../models/donation/wishlistModel');
const Adopter = require('../../models/adopter/adopterModel');

const publicDonationController = {

  // GET /api/donations/eligible-adoptees
  getEligibleAdoptees: async (req, res) => {
    try {
      const adoptees = await Donation.getEligibleAdoptees();
      res.json(adoptees);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not load donation listings.' });
    }
  },

  // GET /api/donations/eligible-adoptees/:id
  getEligibleAdopteeById: async (req, res) => {
    try {
      const adoptee = await Donation.getEligibleAdopteeById(req.params.id);
      if (!adoptee) return res.status(404).json({ error: 'Not found.' });
      res.json(adoptee);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not load this listing.' });
    }
  },

  // GET /api/donations/wishlist
  getWishlist: async (req, res) => {
    try {
      const items = await Wishlist.getPublicNeeded();
      res.json(items);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not load wishlist requests.' });
    }
  },

  // GET /api/donations/wishlist/:id
  getWishlistById: async (req, res) => {
    try {
      const item = await Wishlist.getPublicNeededById(req.params.id);
      if (!item) return res.status(404).json({ error: 'Not found.' });
      res.json(item);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not load this request.' });
    }
  },

  // GET /api/donations/whoami — lets the frontend know whether to show
  // the guest-info fields or "Donating as: <name>" for a logged-in Adopter.
  // Anyone else (guest, other roles) is treated as a guest donor.
  whoami: async (req, res) => {
    if (req.session.userRole === 'adopter') {
      const adopter = await Adopter.findById(req.session.userId);
      if (adopter) return res.json({ isAdopter: true, name: adopter.name, email: adopter.email });
    }
    res.json({ isAdopter: false });
  },

  // POST /api/donations/donate-money  { AE_ID, amount, guest_name?, guest_email?, guest_phone? }
  donateMoney: async (req, res) => {
    try {
      const { AE_ID, amount, guest_name, guest_email, guest_phone } = req.body;
      if (!AE_ID || !amount || amount <= 0) {
        return res.status(400).json({ error: 'AE_ID and a valid amount are required.' });
      }

      const eligible = await Donation.getEligibleAdopteeById(AE_ID);
      if (!eligible) return res.status(404).json({ error: 'This adoptee is not eligible for donations.' });

      // Trust the SESSION for who's donating, never the request body —
      // never let a client claim to be a logged-in adopter by just
      // sending an AR_ID.
      const isAdopter = req.session.userRole === 'adopter';
      if (!isAdopter && (!guest_name || !guest_email)) {
        return res.status(400).json({ error: 'Name and email are required for guest donations.' });
      }

      const donation_id = await Donation.createMoneyDonation({
        AE_ID,
        amount,
        donor_AR_ID: isAdopter ? req.session.userId : null,
        guest_name: isAdopter ? null : guest_name,
        guest_email: isAdopter ? null : guest_email,
        guest_phone: isAdopter ? null : guest_phone
      });

      res.status(201).json({ message: 'Thank you for your donation!', donation_id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not process donation.' });
    }
  },

  // POST /api/donations/fulfill-wishlist  { item_id, guest_name?, guest_email?, guest_phone? }
  fulfillWishlist: async (req, res) => {
    try {
      const { item_id, guest_name, guest_email, guest_phone } = req.body;
      if (!item_id) return res.status(400).json({ error: 'item_id is required.' });

      const item = await Wishlist.getPublicNeededById(item_id);
      if (!item) return res.status(404).json({ error: 'This request is not available.' });

      const isAdopter = req.session.userRole === 'adopter';
      if (!isAdopter && (!guest_name || !guest_email)) {
        return res.status(400).json({ error: 'Name and email are required for guest donations.' });
      }

      const donation_id = await Donation.createNeedBasedDonation({
        AE_ID: item.AE_ID,
        wishlist_request_id: item_id,
        donor_AR_ID: isAdopter ? req.session.userId : null,
        guest_name: isAdopter ? null : guest_name,
        guest_email: isAdopter ? null : guest_email,
        guest_phone: isAdopter ? null : guest_phone
      });

      await Wishlist.markFulfilled(item_id);

      res.status(201).json({ message: 'Thank you — this need has been marked as fulfilled!', donation_id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not process donation.' });
    }
  }

};

module.exports = publicDonationController;
