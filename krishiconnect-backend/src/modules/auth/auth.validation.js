const Joi = require('joi');

const registerSchema = Joi.object({
  phoneNumber: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid Indian phone number',
    }),
  email: Joi.string().email().lowercase().trim().allow('').optional(),
  name: Joi.string().required().trim().max(100),
  password: Joi.string().min(6).required(),
  location: Joi.object({
    state: Joi.string(),
    district: Joi.string(),
    village: Joi.string(),
  }),
});

const verifyOTPSchema = Joi.object({
  phoneNumber: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .required(),
  otp: Joi.string().length(6).required(),
});

const verifyRegistrationOTPSchema = Joi.object({
  otpId: Joi.string().required(),
  otp: Joi.string().length(6).required(),
});

const loginSchema = Joi.object({
  phoneNumber: Joi.string().pattern(/^[6-9]\d{9}$/).allow('').optional(),
  email: Joi.string().email().lowercase().trim().allow('').optional(),
  password: Joi.string().required(),
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

const forgotPasswordSchema = Joi.object({
  phoneNumber: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .required(),
});

const resetPasswordSchema = Joi.object({
  phoneNumber: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .required(),
  otp: Joi.string().length(6).required(),
  newPassword: Joi.string().min(6).required(),
});

const forgotPasswordEmailSchema = Joi.object({
  email: Joi.string().email().required().lowercase().trim(),
});

const resetPasswordWithOTPSchema = Joi.object({
  otpId: Joi.string().required(),
  otp: Joi.string().length(6).required(),
  newPassword: Joi.string().min(6).max(50).required(),
});

const resendOTPSchema = Joi.object({
  otpId: Joi.string().required(),
});

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });
console.log(error);
console.log(value);
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
  registerSchema,
  verifyOTPSchema,
  verifyRegistrationOTPSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  forgotPasswordEmailSchema,
  resetPasswordWithOTPSchema,
  resendOTPSchema,
  validate,
};
