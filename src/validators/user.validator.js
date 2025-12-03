const Joi = require("joi");

exports.updateProfileSchema = Joi.object({
  fullName: Joi.string().min(2).max(100).optional(),
  currency: Joi.string().length(3).optional(),
  language: Joi.string().max(10).optional(),
});

exports.changePasswordSchema = Joi.object({
  oldPassword: Joi.string().min(6).required(),
  newPassword: Joi.string().min(6).required(),
});
