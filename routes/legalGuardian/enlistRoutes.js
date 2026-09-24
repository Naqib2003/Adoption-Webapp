const express = require('express');
const router = express.Router();
const enlistController = require('../../controllers/legalGuardian/enlistController');
const { requireRole, requireVerified } = require('../../middleware/auth');

router.use(requireRole('legalGuardian'), requireVerified);

router.post('/enlist', enlistController.enlist);
router.post('/reapply', enlistController.reapply);
router.get('/pending', enlistController.getPending);
router.get('/enlisted-children', enlistController.getEnlistedChildren);
router.get('/enlisted-elders', enlistController.getEnlistedElders);
router.get('/:id', enlistController.getById);

module.exports = router;
