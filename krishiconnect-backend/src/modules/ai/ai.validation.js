const Joi = require('joi');

const askSchema = Joi.object({
  question: Joi.string().min(10).max(1000).required(),
  model: Joi.string().valid('llama3-8b-8192', 'llama3-70b-8192', 'mixtral-8x7b-32768').optional(),
});

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errors = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));
    const ApiError = require('../../utils/ApiError');
    throw new ApiError(400, 'Validation failed', errors);
  }

  req.body = value;
  next();
};

module.exports = {
  askSchema,
  validate,
};
