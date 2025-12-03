const walletRepo = require("../repositories/wallet.repository");

exports.create = async (
  userId,
  { name, type, initialBalance = 0, color, icon }
) => {
  const data = { userId, name, type, balance: initialBalance, color, icon };
  return walletRepo.create(data);
};

exports.list = async (userId, { page = 1, limit = 20 } = {}) => {
  const skip = (page - 1) * limit;
  const items = await walletRepo.findByUser(userId, { skip, take: limit });
  return { items };
};

exports.detail = async (id) => walletRepo.findById(id);

exports.update = async (id, payload) => walletRepo.update(id, payload);

exports.remove = async (id) => walletRepo.remove(id);
