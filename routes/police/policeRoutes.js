const express = require('express');
const router = express.Router();
const policeController = require('../../controllers/police/policeController');
const { requireRole } = require('../../middleware/auth');

// Every route in this file requires the 'police' role — applied once here
// instead of repeating requireRole('police') on every single line below.
router.use(requireRole('police'));

router.get('/pending-adopters', policeController.getPendingAdopters);
router.get('/pending-guardians', policeController.getPendingGuardians);
router.get('/pending-adoptees', policeController.getPendingAdoptees);

router.post('/verify-adopter', policeController.verifyAdopter);
router.post('/verify-guardian', policeController.verifyGuardian);
router.post('/verify-adoptee', policeController.verifyAdoptee);

router.get('/adopters/:id', policeController.getAdopterById);
router.get('/guardians/:id', policeController.getGuardianById);
router.get('/adoptees/:id', policeController.getAdopteeById);

module.exports = router;
