const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { ensureGuest } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

router.get('/register', ensureGuest, AuthController.renderRegister);
router.post('/register', ensureGuest, authLimiter, AuthController.register);

router.get('/login', ensureGuest, AuthController.renderLogin);
router.post('/login', ensureGuest, authLimiter, AuthController.login);

router.post('/logout', AuthController.logout);
router.get('/logout', AuthController.logout);

module.exports = router;
