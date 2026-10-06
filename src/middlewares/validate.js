import ApiError from '../utils/ApiError.js';

// Validates the request and exposes parsed values on req.validated.
// (Express 5 makes req.query a getter, so we don't mutate the originals.)
export default function validate({ body, params, query } = {}) {
  return (req, _res, next) => {
    const errors = [];

    const run = (schema, value, key) => {
      if (!schema) return undefined;
      const result = schema.safeParse(value);
      if (!result.success) {
        errors.push(...result.error.issues.map((i) => ({ in: key, path: i.path.join('.'), message: i.message })));
        return undefined;
      }
      return result.data;
    };

    const parsedBody = run(body, req.body, 'body');
    const parsedParams = run(params, req.params, 'params');
    const parsedQuery = run(query, req.query, 'query');

    if (errors.length) return next(ApiError.badRequest('Validation failed', errors));

    req.validated = { body: parsedBody, params: parsedParams, query: parsedQuery };
    next();
  };
}
