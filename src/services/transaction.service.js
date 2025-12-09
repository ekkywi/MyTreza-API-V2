const trxRepo = require("../repositories/transaction.repository");
const walletRepo = require("../repositories/wallet.repository");
const prisma = require("../infrastructure/prismaClient");

const notificationService = require("./notification.service");

async function checkBudget(userId, date) {
  try {
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    // 1. Get Global Budget
    const budget = await prisma.budgetMonthly.findFirst({
      where: { userId, month, year },
    });

    if (!budget) return;

    // 2. Calculate Total Expense
    const aggregations = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        userId,
        type: "EXPENSE",
        date: {
          gte: new Date(year, month - 1, 1),
          lt: new Date(year, month, 1),
        },
      },
    });

    const totalExpense = aggregations._sum.amount || 0;

    // 3. Check Threshold
    if (totalExpense > budget.amount) {
      await notificationService.create(userId, {
        title: "Budget Exceeded! 🚨",
        message: `You have exceeded your monthly budget of ${budget.amount}. Current total: ${totalExpense}`,
        type: "DANGER",
      });
    } else if (totalExpense > budget.amount * 0.8) {
      // Check if we already sent a warning? (Optimization for later)
      await notificationService.create(userId, {
        title: "Budget Warning ⚠️",
        message: `You have reached 80% of your monthly budget.`,
        type: "WARNING",
      });
    }
  } catch (err) {
    console.error("Failed to check budget:", err);
  }
}

exports.create = async (
  userId,
  { walletId, categoryId, type, amount, description, date }
) => {
  // basic validation
  const wallet = await walletRepo.findById(walletId);
  if (!wallet)
    throw Object.assign(new Error("Wallet not found"), { status: 404 });
  if (type === "EXPENSE" && wallet.balance < amount) {
    throw Object.assign(new Error("Insufficient wallet balance"), {
      status: 400,
    });
  }

  // update wallet balance atomically inside transaction
  const result = await prisma.$transaction(async (tx) => {
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

  // Check Budget (Fire and forget or await)
  if (type === "EXPENSE") {
    await checkBudget(userId, date ? new Date(date) : new Date());
  }

  return result;
};

exports.findAll = async (userId, query) => {
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
    month,
    year,
  } = query;

  const where = { userId };

  // Month/Year Filter (Priority over startDate/endDate)
  if (month || year) {
    const now = new Date();
    const targetYear = year ? Number(year) : now.getFullYear();
    const targetMonth = month ? Number(month) : now.getMonth() + 1;

    const start = new Date(targetYear, targetMonth - 1, 1);
    const end = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

    where.date = { gte: start, lte: end };
  }
  // Custom Date Range
  else if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.date.lte = end;
    }
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
      { category: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  // Sorting
  let orderBy = { date: "desc" };
  if (sort === "oldest") orderBy = { date: "asc" };
  if (sort === "amount-high") orderBy = { amount: "desc" };
  if (sort === "amount-low") orderBy = { amount: "asc" };

  // Pagination
  const pageNum = Number(page) || 1;
  const limitNum = Math.min(Number(limit) || 20, 100); // Cap limit at 100
  const skip = (pageNum - 1) * limitNum;
  const take = limitNum;

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
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  };
};
exports.update = async (id, payload, userId) => {
  const result = await prisma.$transaction(async (tx) => {
    // 1. Get old transaction
    const oldTrx = await tx.transaction.findUnique({
      where: { id },
      include: { wallet: true },
    });
    if (!oldTrx)
      throw Object.assign(new Error("Transaction not found"), { status: 404 });

    // Check ownership
    if (oldTrx.userId !== userId) {
      throw Object.assign(new Error("Forbidden access"), { status: 403 });
    }

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
    if (walletBalance < 0) {
      throw Object.assign(new Error("Insufficient wallet balance"), { status: 400 });
    }
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

  // Check Budget
  if (payload.type === "EXPENSE" || (!payload.type && result.type === "EXPENSE")) {
    await checkBudget(userId, result.date);
  }

  return result;
};

exports.remove = async (id, userId) => {
  return prisma.$transaction(async (tx) => {
    // 1. Get transaction to delete
    const trx = await tx.transaction.findUnique({
      where: { id },
      include: { wallet: true },
    });
    if (!trx)
      throw Object.assign(new Error("Transaction not found"), { status: 404 });

    // Check ownership
    if (trx.userId !== userId) {
      throw Object.assign(new Error("Forbidden access"), { status: 403 });
    }

    // 2. Revert wallet balance
    let newBalance = trx.wallet.balance;
    if (trx.type === "INCOME") {
      newBalance -= trx.amount;
    } else {
      newBalance += trx.amount;
    }

    // 3. Update wallet
    if (newBalance < 0) {
      throw Object.assign(new Error("Insufficient wallet balance"), { status: 400 });
    }
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


