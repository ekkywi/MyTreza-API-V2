const trxRepo = require("../repositories/transaction.repository");
const walletRepo = require("../repositories/wallet.repository");
const prisma = require("../infrastructure/prismaClient");

exports.create = async (
  userId,
  { walletId, categoryId, type, amount, description, date }
) => {
  // basic validation
  const wallet = await walletRepo.findById(walletId);
  if (!wallet)
    throw Object.assign(new Error("Wallet not found"), { status: 404 });
  if (type === "EXPENSE" && wallet.balance < amount) {
    // still allow negative? we will allow but warn. For now, let's block.
    throw Object.assign(new Error("Insufficient wallet balance"), {
      status: 400,
    });
  }

  // update wallet balance atomically inside transaction
  const prisma = require("../infrastructure/prismaClient");
  return prisma.$transaction(async (tx) => {
    // 1. create transaction
    const created = await tx.transaction.create({
      data: {
        userId,
        walletId,
        categoryId,
        type,
        amount,
        description,
        date: new Date(date),
      },
    });
    // 2. update wallet
    const newBalance =
      type === "INCOME" ? wallet.balance + amount : wallet.balance - amount;
    await tx.wallet.update({
      where: { id: walletId },
      data: { balance: newBalance },
    });
    return created;
  });
};

exports.list = (opts) => trxRepo.list(opts);

exports.detail = (id) => trxRepo.findById(id);

exports.update = async (id, payload) => trxRepo.update(id, payload);

exports.remove = async (id) => trxRepo.remove(id);

exports.updateReceipt = async (id, receiptUrl) => {
  return prisma.transaction.update({
    where: { id },
    data: { attachmentUrl: receiptUrl },
  });
};
