const prisma = require("../infrastructure/prismaClient");

exports.create = async (
  userId,
  { fromWalletId, toWalletId, amount, description, date }
) => {
  if (fromWalletId === toWalletId)
    throw Object.assign(new Error("Cannot transfer to same wallet"), {
      status: 400,
    });
  return prisma.$transaction(async (tx) => {
    const from = await tx.wallet.findUnique({ where: { id: fromWalletId } });
    const to = await tx.wallet.findUnique({ where: { id: toWalletId } });
    if (!from || !to)
      throw Object.assign(new Error("Wallet not found"), { status: 404 });
    if (from.balance < amount)
      throw Object.assign(new Error("Insufficient balance"), { status: 400 });
    // 1. create transfer record
    const transfer = await tx.transfer.create({
      data: {
        userId,
        fromWalletId,
        toWalletId,
        amount,
        description,
        date: date ? new Date(date) : new Date(),
      },
    });
    // 2. update balances
    await tx.wallet.update({
      where: { id: fromWalletId },
      data: { balance: from.balance - amount },
    });
    await tx.wallet.update({
      where: { id: toWalletId },
      data: { balance: to.balance + amount },
    });
    // 3. create two transactions (optional): expense + income for bookkeeping
    await tx.transaction.create({
      data: {
        userId,
        walletId: fromWalletId,
        type: "EXPENSE",
        amount,
        description: `Transfer to ${to.name}`,
        date: date ? new Date(date) : new Date(),
      },
    });
    await tx.transaction.create({
      data: {
        userId,
        walletId: toWalletId,
        type: "INCOME",
        amount,
        description: `Transfer from ${from.name}`,
        date: date ? new Date(date) : new Date(),
      },
    });
    return transfer;
  });
};

exports.list = ({ userId, page = 1, limit = 20 }) => {
  const skip = (page - 1) * limit;
  return prisma.transfer.findMany({
    where: { userId },
    skip,
    take: limit,
    orderBy: { createdAt: "desc" },
  });
};
