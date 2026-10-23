const { User } = require('../models');

async function attachUser(req, res, next) {
  res.locals.currentUser = null;
  res.locals.isAuthenticated = false;

  if (req.session && req.session.userId) {
    try {
      const user = await User.findByPk(req.session.userId);
      if (user && user.isActive) {
        req.user = user;
        res.locals.currentUser = user.toSafeJSON();
        res.locals.isAuthenticated = true;
      } else {
        // Session user no longer exists or is inactive
        req.session.userId = null;
      }
    } catch (err) {
      console.error('[AUTH MIDDLEWARE ERROR]:', err);
    }
  }
  next();
}

function ensureAuthenticated(req, res, next) {
  if (req.session && req.session.userId && req.user) {
    return next();
  }
  if (req.session) {
    req.session.returnTo = req.originalUrl;
  }
  if (req.flash) {
    req.flash('error', 'Please log in to access this page.');
  }
  return res.redirect('/auth/login');
}

function ensureGuest(req, res, next) {
  if (req.session && req.session.userId) {
    return res.redirect('/dashboard');
  }
  return next();
}

function ensureAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  if (req.flash) {
    req.flash('error', 'Administrator access required.');
  }
  return res.status(403).render('pages/errors/403', {
    title: '403 Forbidden - Access Denied',
    message: 'You do not have permission to access the administrative console.'
  });
}

module.exports = {
  attachUser,
  ensureAuthenticated,
  ensureGuest,
  ensureAdmin
};
