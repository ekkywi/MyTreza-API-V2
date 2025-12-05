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
        date: date ? new Date(date) : new Date(),
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

exports.update = async (id, payload) => {
  const prisma = require("../infrastructure/prismaClient");

  return prisma.$transaction(async (tx) => {
    // 1. Get old transaction
    const oldTrx = await tx.transaction.findUnique({
      where: { id },
      include: { wallet: true },
    });
    if (!oldTrx)
      throw Object.assign(new Error("Transaction not found"), { status: 404 });

    // 2. Calculate revert amount (undo old transaction)
    let walletBalance = oldTrx.wallet.balance;
    if (oldTrx.type === "INCOME") {
      walletBalance -= oldTrx.amount;
    } else {
      walletBalance += oldTrx.amount;
    }

    // 3. Apply new transaction effect
    // Use new values if provided, otherwise use old values
    const newAmount =
      payload.amount !== undefined ? payload.amount : oldTrx.amount;
    const newType = payload.type || oldTrx.type;

    if (newType === "INCOME") {
      walletBalance += newAmount;
    } else {
      walletBalance -= newAmount;
    }

    // 4. Update wallet balance
    await tx.wallet.update({
      where: { id: oldTrx.walletId },
      data: { balance: walletBalance },
    });

    // 5. Update transaction record
    return tx.transaction.update({
      where: { id },
      data: payload,
    });
  });
};

exports.remove = async (id) => {
  const prisma = require("../infrastructure/prismaClient");

  return prisma.$transaction(async (tx) => {
    // 1. Get transaction to delete
    const trx = await tx.transaction.findUnique({
      where: { id },
      include: { wallet: true },
    });
    if (!trx)
      throw Object.assign(new Error("Transaction not found"), { status: 404 });

    // 2. Revert wallet balance
    let newBalance = trx.wallet.balance;
    if (trx.type === "INCOME") {
      newBalance -= trx.amount;
    } else {
      newBalance += trx.amount;
    }

    // 3. Update wallet
    await tx.wallet.update({
      where: { id: trx.walletId },
      data: { balance: newBalance },
    });

    // 4. Delete transaction
    return tx.transaction.delete({ where: { id } });
  });
};

exports.updateReceipt = async (id, receiptUrl) => {
  return prisma.transaction.update({
    where: { id },
    data: { attachmentUrl: receiptUrl },
  });
};

exports.search = async (userId, query) => {
  const {
    walletId,
    categoryId,
    type,
    q,
    startDate,
    endDate,
    minAmount,
    maxAmount,
    sort,
    page,
    limit,
  } = query;

  const where = { userId };

  // Date Range
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }

  // Wallet Filter
  if (walletId) where.walletId = walletId;

  // Category Filter
  if (categoryId) where.categoryId = categoryId;

  // Type Filter
  if (type) where.type = type;

  // Amount Range
  if (minAmount || maxAmount) {
    where.amount = {};
    if (minAmount) where.amount.gte = Number(minAmount);
    if (maxAmount) where.amount.lte = Number(maxAmount);
  }

  // Search Text
  if (q) {
    where.OR = [
      { description: { contains: q, mode: "insensitive" } },
      { note: { contains: q, mode: "insensitive" } },
    ];
  }

  // Sorting
  let orderBy = { date: "desc" };
  if (sort === "oldest") orderBy = { date: "asc" };
  if (sort === "amount-high") orderBy = { amount: "desc" };
  if (sort === "amount-low") orderBy = { amount: "asc" };

  // Pagination
  const skip = (page - 1) * limit;
  const take = limit;

  const [items, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { wallet: true, category: true },
      orderBy,
      skip,
      take,
    }),
    prisma.transaction.count({ where }),
  ]);

  return {
    items,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};
