const walletService = require("../../services/wallet.service");
const { success } = require("../../utils/response");

exports.create = async (req, res, next) => {
  try {
    const wallet = await walletService.create(req.user.id, req.body);
    return success(res, "Wallet created", wallet, 201);
  } catch (err) {
    next(err);
  }
};

exports.list = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const data = await walletService.list(req.user.id, {
      page: Number(page) || 1,
      limit: Number(limit) || 20,
    });
    return success(res, "Wallet list", data);
  } catch (err) {
    next(err);
  }
};

exports.detail = async (req, res, next) => {
  try {
    const wallet = await walletService.detail(req.params.id);
    return success(res, "Wallet detail", wallet);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const updated = await walletService.update(req.params.id, req.body);
    return success(res, "Wallet updated", updated);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await walletService.remove(req.params.id);
    return success(res, "Wallet deleted", null, 204);
  } catch (err) {
    next(err);
  }
};
