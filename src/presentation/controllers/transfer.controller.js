const transferService = require("../../services/transfer.service");
const { success } = require("../../utils/response");

exports.create = async (req, res, next) => {
  try {
    const transfer = await transferService.create(req.user.id, req.body);
    return success(res, "Transfer completed", transfer, 201);
  } catch (err) {
    next(err);
  }
};

exports.list = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const list = await transferService.list({
      userId: req.user.id,
      page: Number(page) || 1,
      limit: Number(limit) || 20,
    });
    return success(res, "Transfers", list);
  } catch (err) {
    next(err);
  }
};

exports.uploadReceipt = async (req, res, next) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "File tidak ditemukan" });
    }

    const fileUrl = `/uploads/receipt/${req.file.filename}`;

    const trx = await transactionService.updateReceipt(req.params.id, fileUrl);

    res.json({
      success: true,
      message: "Receipt berhasil diupload",
      data: { receiptUrl: fileUrl },
    });
  } catch (err) {
    next(err);
  }
};
