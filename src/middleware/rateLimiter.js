const rateLimit = require('express-rate-limit');

const isTest = process.env.NODE_ENV === 'test';

// General site rate limiter
const generalLimiter = isTest ? (req, res, next) => next() : rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 300,
  message: 'Too many requests from this IP address. Please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false
});

// Stricter rate limiter for authentication routes (login / register)
const authLimiter = isTest ? (req, res, next) => next() : rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 20,
  message: 'Too many authentication attempts. Please wait 15 minutes before trying again.',
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  generalLimiter,
  authLimiter
};
