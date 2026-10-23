const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/dashboardController');
const { ensureAuthenticated } = require('../middleware/auth');

router.get('/', ensureAuthenticated, DashboardController.renderDashboard);

module.exports = router;
