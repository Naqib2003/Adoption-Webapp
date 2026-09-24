const express = require('express');
const router = express.Router();
const visitorController = require('../../controllers/visitor/visitorController');

router.get('/roles', visitorController.getAvailableRoles);

module.exports = router;
