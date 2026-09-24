const express = require('express');
const router = express.Router();
const lawyerController = require('../../controllers/lawyer/lawyerController');
const { requireRole } = require('../../middleware/auth');

router.use(requireRole('lawyer'));

router.get('/dashboard', lawyerController.getDashboard);
router.get('/meetings', lawyerController.getMeetings);
router.get('/meetings/:id', lawyerController.getMeetingById);
router.get('/approval-requests', lawyerController.getApprovalRequests);
router.get('/approval-requests/:id', lawyerController.getApprovalRequestById);
router.post('/decide', lawyerController.decide);
router.get('/approved', lawyerController.getApproved);
router.get('/approved/:id', lawyerController.getApprovedById);

module.exports = router;
