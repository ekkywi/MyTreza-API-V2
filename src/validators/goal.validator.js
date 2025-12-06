const Joi = require("joi");

exports.createGoalSchema = Joi.object({
    name: Joi.string().required(),
    targetAmount: Joi.number().positive().required(),
    deadline: Joi.date().iso().optional(),
    icon: Joi.string().optional(),
    color: Joi.string().optional(),
});

exports.updateGoalSchema = Joi.object({
    name: Joi.string().optional(),
    targetAmount: Joi.number().positive().optional(),
    deadline: Joi.date().iso().optional(),
    icon: Joi.string().optional(),
    color: Joi.string().optional(),
});

exports.fundGoalSchema = Joi.object({
    walletId: Joi.string().uuid().required(),
    amount: Joi.number().positive().required(),
});
