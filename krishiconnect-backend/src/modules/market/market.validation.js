const Joi = require('joi');
const ApiError = require('../../utils/ApiError');

/** Query validation for GET /market/prices */
const getPricesSchema = Joi.object({
  state: Joi.string().trim().max(100).optional(),
  district: Joi.string().trim().max(100).optional(),
  commodity: Joi.string().trim().max(100).optional(),
  date: Joi.string().trim().optional(), // ISO date string or YYYY-MM-DD
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string().valid('price_asc', 'price_desc', 'recent').optional(),
  q: Joi.string().trim().max(200).optional(),
});

/** Validate req.query and assign validated value */
function validateQuery(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      const msg = error.details.map((d) => d.message).join('; ') || 'Validation failed';
      throw new ApiError(400, msg);
    }
    req.query = value;
    next();
  };
}

module.exports = {
  getPricesSchema,
  validateQuery,
};
