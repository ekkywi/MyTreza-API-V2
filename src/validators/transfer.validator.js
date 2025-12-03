const Joi = require("joi");

exports.createTransferSchema = Joi.object({
  fromWalletId: Joi.string().uuid().required(),
  toWalletId: Joi.string().uuid().required(),
  amount: Joi.number().positive().required(),
  description: Joi.string().max(500).optional().allow(""),
  date: Joi.date().iso().optional(),
}).custom((value, helpers) => {
  if (value.fromWalletId === value.toWalletId) {
    return helpers.error("any.invalid", {
      message: "fromWalletId and toWalletId must be different",
    });
  }
  return value;
});
