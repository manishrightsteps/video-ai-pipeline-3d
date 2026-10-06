import config from '../config/index.js';
import ApiError from '../utils/ApiError.js';

export function notFound(req, _res, next) {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  // Malformed JSON body from express.json()
  if (err.type === 'entity.parse.failed') err = ApiError.badRequest('Invalid JSON body');
  if (err.type === 'entity.too.large') err = new ApiError(413, 'Request body too large');

  const statusCode = err.statusCode || 500;
  const isOperational = err instanceof ApiError || err.isOperational;

  if (statusCode >= 500) req.log?.error({ err }, 'Request failed');
  else req.log?.warn({ statusCode, message: err.message }, 'Request rejected');

  // Audio may already be streaming — we can't send JSON now, just end the response.
  if (res.headersSent) return res.end();

  res.status(statusCode).json({
    success: false,
    error: {
      message: isOperational || !config.isProd ? err.message : 'Internal server error',
      ...(err.details ? { details: err.details } : {}),
      ...(!config.isProd && !isOperational ? { stack: err.stack } : {}),
    },
  });
}
