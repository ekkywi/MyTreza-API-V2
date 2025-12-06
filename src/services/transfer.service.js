const prisma = require("../infrastructure/prismaClient");

exports.create = async (
  userId,
  { fromWalletId, toWalletId, amount, adminFee = 0, description, date }
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

    // Enforce Internal Transfer Only
    if (from.userId !== userId || to.userId !== userId) {
      throw Object.assign(
        new Error("Forbidden: You can only transfer between your own wallets"),
        { status: 403 }
      );
    }

    const totalDeduction = amount + Number(adminFee);

    if (from.balance < totalDeduction)
      throw Object.assign(
        new Error("Insufficient balance (including admin fee)"),
        { status: 400 }
      );

    // 1. create transfer record
    const transfer = await tx.transfer.create({
      data: {
        userId,
        fromWalletId,
        toWalletId,
        amount,
        adminFee: Number(adminFee),
        description,
        date: date ? new Date(date) : new Date(),
      },
    });

    // 2. update balances
    // Sender pays amount + adminFee
    await tx.wallet.update({
      where: { id: fromWalletId },
      data: { balance: from.balance - totalDeduction },
    });
    // Receiver gets ONLY amount
    await tx.wallet.update({
      where: { id: toWalletId },
      data: { balance: to.balance + amount },
    });

    // 3. create transactions for bookkeeping
    // Find "Transfer Antar Wallet" category
    const transferCategory = await tx.category.findFirst({
      where: { name: "Transfer Antar Wallet", type: "EXPENSE" },
    });

    // Expense for Sender: Amount + Fee
    await tx.transaction.create({
      data: {
        userId,
        walletId: fromWalletId,
        categoryId: transferCategory ? transferCategory.id : null,
        type: "EXPENSE",
        amount: totalDeduction,
        description: `Transfer to ${to.name} (Fee: ${adminFee})`,
        date: date ? new Date(date) : new Date(),
      },
    });

    // Find "Transfer Antar Wallet" (INCOME) category
    const transferIncomeCategory = await tx.category.findFirst({
      where: { name: "Transfer Antar Wallet", type: "INCOME" },
    });

    // Income for Receiver: Only Amount
    await tx.transaction.create({
      data: {
        userId,
        walletId: toWalletId,
        categoryId: transferIncomeCategory ? transferIncomeCategory.id : null,
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
