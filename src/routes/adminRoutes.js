const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const { ensureAuthenticated, ensureAdmin } = require('../middleware/auth');

router.use(ensureAuthenticated);
router.use(ensureAdmin);

router.get('/', AdminController.renderAdminDashboard);
router.post('/users/:id/toggle', AdminController.toggleUserStatus);
router.post('/polls/:id/delete', AdminController.deletePoll);
router.post('/surveys/:id/delete', AdminController.deleteSurvey);

module.exports = router;
