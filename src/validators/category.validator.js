const Joi = require("joi");

exports.createCategorySchema = Joi.object({
  name: Joi.string().min(1).max(80).required(),
  type: Joi.string().valid("INCOME", "EXPENSE").required(),
  icon: Joi.string().max(50).optional(),
  icon: Joi.string().optional().allow(null, ''),
  color: Joi.string().optional().allow(null, '')
});

exports.updateCategorySchema = Joi.object({
  name: Joi.string().min(1).max(80).optional(),
  icon: Joi.string().max(50).optional(),
});
