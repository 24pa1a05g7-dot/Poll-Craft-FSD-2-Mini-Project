function notFoundHandler(req, res, next) {
  res.status(404);
  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.json({ error: 'The requested resource was not found on this server.' });
  }
  res.render('pages/errors/404', {
    title: '404 - Page Not Found',
    message: 'The page or resource you are looking for does not exist or has been moved.'
  });
}

function globalErrorHandler(err, req, res, next) {
  console.error('[SERVER ERROR]:', err);
  const status = err.status || 500;
  res.status(status);

  const isProduction = process.env.NODE_ENV === 'production';
  const errorMessage = isProduction 
    ? 'An unexpected error occurred while processing your request. Please try again later.'
    : err.message || 'Internal Server Error';

  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.json({ error: errorMessage });
  }

  res.render('pages/errors/500', {
    title: '500 - Internal Server Error',
    message: errorMessage,
    error: isProduction ? {} : err
  });
}

module.exports = {
  notFoundHandler,
  globalErrorHandler
};
