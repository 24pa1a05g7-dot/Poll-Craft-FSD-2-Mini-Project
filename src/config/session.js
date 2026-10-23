const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const { sequelize } = require('../models');

const isProduction = process.env.NODE_ENV === 'production';

const sessionStore = new SequelizeStore({
  db: sequelize,
  tableName: 'sessions',
  checkExpirationInterval: 15 * 60 * 1000, // clean up expired sessions every 15 min
  expiration: 24 * 60 * 60 * 1000 // 24 hours
});

const sessionMiddleware = session({
  name: 'quickpulse.sid',
  secret: process.env.SESSION_SECRET || 'dev-insecure-secret-key-change-me',
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: isProduction, // HTTPS in production
    sameSite: 'lax',
    maxAge: parseInt(process.env.SESSION_MAX_AGE_MS, 10) || 24 * 60 * 60 * 1000
  }
});

module.exports = { sessionMiddleware, sessionStore };
