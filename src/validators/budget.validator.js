const Joi = require("joi");

exports.monthlySchema = Joi.object({
  month: Joi.number().min(1).max(12).required(),
  year: Joi.number().min(2000).max(2100).required(),
  amount: Joi.number().min(0).required(),
});

exports.getMonthlyBudgetSchema = Joi.object({
  month: Joi.number().integer().required().messages({
    "any.required": "month wajib diisi",
  }),
  year: Joi.number().integer().required().messages({
    "any.required": "year wajib diisi",
  }),
}).unknown(true);

exports.categorySchema = Joi.object({
  categoryId: Joi.string().required(),
  month: Joi.number().min(1).max(12).required(),
  year: Joi.number().min(2000).max(2100).required(),
  amount: Joi.number().min(0).required(),
});

exports.usageSchema = Joi.object({
  month: Joi.number().min(1).max(12).required(),
  year: Joi.number().min(2000).max(2100).required(),
});
