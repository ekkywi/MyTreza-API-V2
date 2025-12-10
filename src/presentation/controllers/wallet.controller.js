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

exports.stats = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const stats = await walletService.getStats(req.params.id, req.user.id, {
      month,
      year,
    });
    return success(res, "Wallet stats retrieved", stats);
  } catch (err) {
    next(err);
  }
};

exports.dailyStats = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const data = await walletService.getDailyStats(req.params.id, req.user.id, {
      month,
      year,
    });
    return success(res, "Daily stats retrieved", data);
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
    const updated = await walletService.update(
      req.params.id,
      req.body,
      req.user.id
    );
    return success(res, "Wallet updated", updated);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await walletService.remove(req.params.id, req.user.id);
    return success(res, "Wallet deleted", null, 200);
  } catch (err) {
    next(err);
  }
};

exports.archive = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await walletService.archiveWallet(id, userId);

    res.status(200).json({
      success: true,
      message: "Dompet berhasil diarsipkan",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};
