const Joi = require("joi");

exports.createTransactionSchema = Joi.object({
  walletId: Joi.string().uuid().required(),
  categoryId: Joi.string().uuid().optional().allow(null),
  type: Joi.string().valid("INCOME", "EXPENSE").required(),
  amount: Joi.number().positive().required(),
  description: Joi.string().max(500).optional().allow(""),
  date: Joi.date().iso().required(),
});

exports.updateTransactionSchema = Joi.object({
  categoryId: Joi.string().uuid().optional().allow(null),
  amount: Joi.number().positive().optional(),
  description: Joi.string().max(500).optional().allow(""),
  date: Joi.date().iso().optional(),
});
