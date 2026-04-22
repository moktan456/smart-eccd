// SMART ECCD – Zod Request Validation Middleware

/**
 * Validates req.body against a Zod schema.
 * Returns 400 with error details on failure.
 *
 * @param {ZodSchema} schema
 */
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const errors = result.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return res.status(400).json({ success: false, message: 'Validation failed.', errors });
  }

  req.body = result.data; // Use the parsed + coerced data
  next();
};

/**
 * Validates req.query against a Zod schema.
 */
const validateQuery = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.query);
  if (!result.success) {
    const errors = result.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return res.status(400).json({ success: false, message: 'Invalid query parameters.', errors });
  }
  req.query = result.data;
  next();
};

module.exports = { validate, validateQuery };
