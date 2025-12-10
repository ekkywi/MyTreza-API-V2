const trxRepo = require("../repositories/transaction.repository");
const walletRepo = require("../repositories/wallet.repository");
const prisma = require("../infrastructure/prismaClient");
const notificationService = require("./notification.service");

// --- Helper: Check Budget ---
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

    // 3. Check Threshold & Notify
    if (totalExpense > budget.amount) {
      await notificationService.create(userId, {
        title: "Budget Exceeded! 🚨",
        message: `You have exceeded your monthly budget of ${budget.amount}. Current total: ${totalExpense}`,
        type: "DANGER",
      });
    } else if (totalExpense > budget.amount * 0.8) {
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

// --- CREATE TRANSACTION ---
exports.create = async (
  userId,
  { walletId, categoryId, type, amount, description, date, transferId } // Added transferId support
) => {
  const wallet = await walletRepo.findById(walletId);
  if (!wallet)
    throw Object.assign(new Error("Wallet not found"), { status: 404 });
  if (type === "EXPENSE" && wallet.balance < amount) {
    throw Object.assign(new Error("Insufficient wallet balance"), {
      status: 400,
    });
  }

  // Atomic Transaction
  const result = await prisma.$transaction(async (tx) => {
    // 1. Create Record
    const created = await tx.transaction.create({
      data: {
        userId,
        walletId,
        categoryId,
        type,
        amount,
        description,
        date: date ? new Date(date) : new Date(),
        transferId: transferId || null, // Link to Transfer if exists
      },
    });

    // 2. Update Wallet Balance
    const newBalance =
      type === "INCOME" ? wallet.balance + amount : wallet.balance - amount;

    await tx.wallet.update({
      where: { id: walletId },
      data: { balance: newBalance },
    });

    return created;
  });

  // Check Budget (Async)
  if (type === "EXPENSE") {
    checkBudget(userId, date ? new Date(date) : new Date());
  }

  return result;
};

// --- FIND ALL (FIXED DESTRUCTURING) ---
exports.findAll = async (userId, query) => {
  // [FIX] Destructure page & limit here to avoid ReferenceError
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
    page = 1, // Default 1
    limit = 20, // Default 20
  } = query;

  const where = { userId };

  // --- FILTERS ---
  if (month || year) {
    const now = new Date();
    const targetYear = year ? Number(year) : now.getFullYear();
    const targetMonth = month ? Number(month) : now.getMonth() + 1;
    const start = new Date(targetYear, targetMonth - 1, 1);
    const end = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);
    where.date = { gte: start, lte: end };
  } else if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.date.lte = end;
    }
  }

  if (walletId) where.walletId = walletId;
  if (categoryId) where.categoryId = categoryId;
  if (type) where.type = type;

  if (minAmount || maxAmount) {
    where.amount = {};
    if (minAmount) where.amount.gte = Number(minAmount);
    if (maxAmount) where.amount.lte = Number(maxAmount);
  }

  if (q) {
    where.OR = [
      { description: { contains: q, mode: "insensitive" } },
      { category: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  // --- SORTING ---
  let orderBy = { date: "desc" };
  if (sort === "oldest") orderBy = { date: "asc" };
  if (sort === "amount-high") orderBy = { amount: "desc" };
  if (sort === "amount-low") orderBy = { amount: "asc" };

  // --- PAGINATION ---
  const pageNum = Number(page);
  const limitNum = Math.min(Number(limit), 100);
  const skip = (pageNum - 1) * limitNum;

  // --- EXECUTE QUERY ---
  const [items, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { wallet: true, category: true }, // Join tables
      orderBy,
      skip,
      take: limitNum,
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

// --- UPDATE TRANSACTION ---
exports.update = async (id, payload, userId) => {
  const result = await prisma.$transaction(async (tx) => {
    // 1. Get Old Data
    const oldTrx = await tx.transaction.findUnique({
      where: { id },
      include: { wallet: true },
    });
    if (!oldTrx)
      throw Object.assign(new Error("Transaction not found"), { status: 404 });
    if (oldTrx.userId !== userId)
      throw Object.assign(new Error("Forbidden access"), { status: 403 });

    // 2. Revert Old Balance
    let walletBalance = oldTrx.wallet.balance;
    walletBalance =
      oldTrx.type === "INCOME"
        ? walletBalance - oldTrx.amount
        : walletBalance + oldTrx.amount;

    // 3. Apply New Balance
    const newAmount =
      payload.amount !== undefined ? payload.amount : oldTrx.amount;
    const newType = payload.type || oldTrx.type;

    walletBalance =
      newType === "INCOME"
        ? walletBalance + newAmount
        : walletBalance - newAmount;

    // 4. Check & Update Wallet
    // (Optional: Allow negative balance? If not, uncomment check)
    // if (walletBalance < 0) throw Object.assign(new Error("Insufficient wallet balance"), { status: 400 });

    await tx.wallet.update({
      where: { id: oldTrx.walletId },
      data: { balance: walletBalance },
    });

    // 5. Update Transaction
    return tx.transaction.update({
      where: { id },
      data: payload,
    });
  });

  // Check Budget Trigger
  if (
    payload.type === "EXPENSE" ||
    (!payload.type && result.type === "EXPENSE")
  ) {
    checkBudget(userId, result.date);
  }

  return result;
};

exports.remove = async (id, userId) => {
  return prisma.$transaction(async (tx) => {
    // 1. Cek Transaksi yang mau dihapus
    const targetTrx = await tx.transaction.findUnique({
      where: { id },
      select: { id: true, userId: true, transferId: true },
    });

    if (!targetTrx)
      throw Object.assign(new Error("Transaction not found"), { status: 404 });
    if (targetTrx.userId !== userId)
      throw Object.assign(new Error("Forbidden access"), { status: 403 });

    // =================================================
    // SKENARIO 1: INI BAGIAN DARI TRANSFER (BERPASANGAN)
    // =================================================
    if (targetTrx.transferId) {
      // Ambil SEMUA transaksi yang terkait dengan Transfer ID ini
      const relatedTransactions = await tx.transaction.findMany({
        where: { transferId: targetTrx.transferId },
        include: { wallet: true },
      });

      // A. Loop untuk mengembalikan saldo (REVERT BALANCE)
      for (const t of relatedTransactions) {
        let revertBalance = t.wallet.balance;

        if (t.type === "INCOME") {
          revertBalance -= t.amount; // Tarik kembali uang masuk
        } else {
          revertBalance += t.amount; // Kembalikan uang keluar
        }

        // Update Saldo Dompet
        await tx.wallet.update({
          where: { id: t.walletId },
          data: { balance: revertBalance },
        });
      }

      // B. HAPUS MANUAL KEDUA TRANSAKSI (Fix Masalah Anda)
      // Kita hapus anak-anaknya dulu biar yakin 100% hilang
      await tx.transaction.deleteMany({
        where: { transferId: targetTrx.transferId },
      });

      // C. Hapus Induk Transfer
      return tx.transfer.delete({
        where: { id: targetTrx.transferId },
      });
    }

    // =================================================
    // SKENARIO 2: TRANSAKSI BIASA (SINGLE)
    // =================================================
    else {
      const trx = await tx.transaction.findUnique({
        where: { id },
        include: { wallet: true },
      });

      let newBalance = trx.wallet.balance;
      if (trx.type === "INCOME") {
        newBalance -= trx.amount;
      } else {
        newBalance += trx.amount;
      }

      await tx.wallet.update({
        where: { id: trx.walletId },
        data: { balance: newBalance },
      });

      return tx.transaction.delete({ where: { id } });
    }
  });
};

exports.updateReceipt = async (id, receiptUrl) => {
  return prisma.transaction.update({
    where: { id },
    data: { attachmentUrl: receiptUrl },
  });
};
