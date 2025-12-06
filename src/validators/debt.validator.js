const Joi = require("joi");

exports.createDebtSchema = Joi.object({
    type: Joi.string().valid("PAYABLE", "RECEIVABLE").required(),
    personName: Joi.string().required(),
    amount: Joi.number().positive().required(),
    dueDate: Joi.date().iso().optional(),
    description: Joi.string().optional().allow(""),
});

exports.updateDebtSchema = Joi.object({
    personName: Joi.string().optional(),
    amount: Joi.number().positive().optional(),
    dueDate: Joi.date().iso().optional(),
    description: Joi.string().optional().allow(""),
});

exports.payDebtSchema = Joi.object({
    walletId: Joi.string().uuid().required(),
    amount: Joi.number().positive().required(),
});
