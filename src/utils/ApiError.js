export default class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
  }

  static badRequest(message = 'Bad request', details) {
    return new ApiError(400, message, details);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }

  static badGateway(message = 'Upstream service error', details) {
    return new ApiError(502, message, details);
  }

  static serviceUnavailable(message = 'Service unavailable') {
    return new ApiError(503, message);
  }
}
