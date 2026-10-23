const express = require('express');
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
require('dotenv').config();

const { sessionMiddleware } = require('./config/session');
const { attachUser } = require('./middleware/auth');
const { csrfProtection } = require('./middleware/csrf');
const { generalLimiter } = require('./middleware/rateLimiter');
const { notFoundHandler, globalErrorHandler } = require('./middleware/errorHandler');
const routes = require('./routes');

const app = express();

// Trust proxy for production hosting (Render, Heroku, etc.)
app.set('trust proxy', 1);

// Security Headers (Configured to permit Bootstrap, Chart.js, and Google Fonts from CDNs)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://cdn.jsdelivr.net',
          'https://cdnjs.cloudflare.com'
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://cdn.jsdelivr.net',
          'https://fonts.googleapis.com',
          'https://cdnjs.cloudflare.com'
        ],
        fontSrc: [
          "'self'",
          'https://fonts.gstatic.com',
          'https://cdn.jsdelivr.net',
          'https://cdnjs.cloudflare.com'
        ],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"]
      }
    },
    crossOriginEmbedderPolicy: false
  })
);

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Rate Limiting
app.use(generalLimiter);

// Body Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static Files
app.use(express.static(path.join(__dirname, 'public')));

// View Engine Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Sessions & Flash
app.use(sessionMiddleware);
app.use(flash());

// Authentication and Context Locals
app.use(attachUser);

// Flash Messages Locals
app.use((req, res, next) => {
  res.locals.successMessages = req.flash('success');
  res.locals.errorMessages = req.flash('error');
  res.locals.appName = process.env.APP_NAME || 'QuickPulse';
  res.locals.currentPath = req.path;
  next();
});

// CSRF Protection
app.use(csrfProtection);

// Application Routes
app.use('/', routes);

// Error Handling
app.use(notFoundHandler);
app.use(globalErrorHandler);

module.exports = app;
