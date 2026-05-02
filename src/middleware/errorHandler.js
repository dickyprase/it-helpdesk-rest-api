/**
 * Global error handler middleware.
 * Semua error yang di-throw atau di-next(err) akan ditangkap di sini.
 */
function errorHandler(err, _req, res, _next) {
  console.error('[ERROR]', err.message);

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: true,
    message: err.message || 'Terjadi kesalahan pada server',
  });
}

module.exports = errorHandler;
