const Joi = require("joi");

exports.createWalletSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  type: Joi.string()
    .valid("CASH", "BANK", "SAVING", "FAMILY", "ASSET")
    .required(),
  initialBalance: Joi.number().min(0).optional(),
  color: Joi.string()
    .pattern(/^#(?:[0-9a-fA-F]{3}){1,2}$/)
    .optional(), // hex color
  icon: Joi.string().max(50).optional(),
});

exports.updateWalletSchema = Joi.object({
  name: Joi.string().min(1).max(100).optional(),
  color: Joi.string()
    .pattern(/^#(?:[0-9a-fA-F]{3}){1,2}$/)
    .optional(),
  icon: Joi.string().max(50).optional(),
});
