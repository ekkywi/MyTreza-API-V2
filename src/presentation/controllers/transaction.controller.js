const transactionService = require("../../services/transaction.service");
const { success } = require("../../utils/response");

exports.create = async (req, res, next) => {
  try {
    const created = await transactionService.create(req.user.id, req.body);
    return success(res, "Transaction created", created, 201);
  } catch (err) {
    next(err);
  }
};

exports.list = async (req, res, next) => {
  try {
    const { walletId, categoryId, type, startDate, endDate, page, limit } =
      req.query;
    const result = await transactionService.list({
      userId: req.user.id,
      walletId,
      categoryId,
      type,
      startDate,
      endDate,
      skip: ((Number(page) || 1) - 1) * (Number(limit) || 20),
      take: Number(limit) || 20,
    });
    return success(res, "Transactions", {
      items: result.items,
      pagination: { total: result.total },
    });
  } catch (err) {
    next(err);
  }
};

exports.detail = async (req, res, next) => {
  try {
    const trx = await transactionService.detail(req.params.id);
    return success(res, "Transaction detail", trx);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const updated = await transactionService.update(req.params.id, req.body);
    return success(res, "Transaction updated", updated);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await transactionService.remove(req.params.id);
    return success(res, "Transaction deleted", null, 200);
  } catch (err) {
    next(err);
  }
};

exports.uploadReceipt = async (req, res, next) => {
  try {
    if (!req.uploadedFileUrl) {
      return res
        .status(400)
        .json({ success: false, message: "Receipt gagal diupload" });
    }

    const fileUrl = req.uploadedFileUrl;

    await transactionService.updateReceipt(req.params.id, fileUrl);

    return res.json({
      success: true,
      message: "Receipt berhasil diupload",
      data: { receiptUrl: fileUrl },
    });
  } catch (err) {
    next(err);
  }
};

exports.search = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const query = {
      walletId: req.query.walletId,
      categoryId: req.query.categoryId,
      type: req.query.type,
      q: req.query.q,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      minAmount: req.query.minAmount,
      maxAmount: req.query.maxAmount,
      sort: req.query.sort || "newest",
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
    };

    const result = await transactionService.search(userId, query);

    return success(res, "Search result fetched", result);
  } catch (err) {
    next(err);
  }
};
