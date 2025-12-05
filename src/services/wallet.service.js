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

exports.update = async (id, payload, userId) => {
  const wallet = await walletRepo.findById(id);
  if (!wallet) throw Object.assign(new Error("Wallet not found"), { status: 404 });
  if (wallet.userId !== userId) throw Object.assign(new Error("Forbidden access"), { status: 403 });

  return walletRepo.update(id, payload);
};

exports.remove = async (id, userId) => {
  const wallet = await walletRepo.findById(id);
  if (!wallet) throw Object.assign(new Error("Wallet not found"), { status: 404 });
  if (wallet.userId !== userId) throw Object.assign(new Error("Forbidden access"), { status: 403 });

  return walletRepo.remove(id);
};
