const crypto = require('crypto');

function csrfProtection(req, res, next) {
  // Ensure session has a csrfToken
  if (req.session) {
    if (!req.session.csrfToken) {
      req.session.csrfToken = crypto.randomBytes(24).toString('hex');
    }
    res.locals.csrfToken = req.session.csrfToken;
  } else {
    res.locals.csrfToken = '';
  }

  // Bypass CSRF for safe HTTP methods (GET, HEAD, OPTIONS)
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // For testing convenience if explicitly enabled
  if (process.env.NODE_ENV === 'test' && req.headers['x-test-bypass-csrf'] === 'true') {
    return next();
  }

  const clientToken = (req.body && req.body._csrf) ||
                      req.headers['csrf-token'] ||
                      req.headers['x-csrf-token'] ||
                      req.query._csrf;

  if (!clientToken || clientToken !== req.session.csrfToken) {
    console.warn(`[SECURITY] CSRF token mismatch on ${req.method} ${req.originalUrl}`);
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(403).json({ error: 'Invalid or missing CSRF security token.' });
    }
    return res.status(403).render('pages/errors/403', {
      title: '403 Forbidden - Invalid CSRF Token',
      message: 'Your form submission failed the security verification check (CSRF). Please refresh the page and try again.'
    });
  }

  next();
}

module.exports = { csrfProtection };
