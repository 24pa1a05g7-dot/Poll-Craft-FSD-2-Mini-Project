const express = require('express');
const router = express.Router();
const ProfileController = require('../controllers/profileController');
const { ensureAuthenticated } = require('../middleware/auth');

router.use(ensureAuthenticated);

router.get('/', ProfileController.renderProfile);
router.post('/update', ProfileController.updateProfile);
router.post('/change-password', ProfileController.changePassword);

module.exports = router;
