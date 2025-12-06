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
    const result = await transactionService.findAll(req.user.id, req.query);
    return success(res, "Transactions fetched", result);
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
    const updated = await transactionService.update(req.params.id, req.body, req.user.id);
    return success(res, "Transaction updated", updated);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await transactionService.remove(req.params.id, req.user.id);
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
