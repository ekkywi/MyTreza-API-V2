const Joi = require("joi");

exports.createRecurringSchema = Joi.object({
    walletId: Joi.string().uuid().required(),
    categoryId: Joi.string().uuid().optional().allow(null),
    type: Joi.string().valid("INCOME", "EXPENSE").required(),
    amount: Joi.number().positive().required(),
    description: Joi.string().optional().allow(""),
    frequency: Joi.string().valid("DAILY", "WEEKLY", "MONTHLY", "YEARLY").required(),
    startDate: Joi.date().iso().required(),
});

exports.updateRecurringSchema = Joi.object({
    walletId: Joi.string().uuid().optional(),
    categoryId: Joi.string().uuid().optional().allow(null),
    type: Joi.string().valid("INCOME", "EXPENSE").optional(),
    amount: Joi.number().positive().optional(),
    description: Joi.string().optional().allow(""),
    frequency: Joi.string().valid("DAILY", "WEEKLY", "MONTHLY", "YEARLY").optional(),
    startDate: Joi.date().iso().optional(),
    isActive: Joi.boolean().optional(),
});
