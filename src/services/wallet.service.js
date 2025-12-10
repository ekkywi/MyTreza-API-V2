const walletRepo = require("../repositories/wallet.repository");
const prisma = require("../infrastructure/prismaClient");

exports.create = async (userId, payload) => {
  const { name, type, balance, initialBalance, color, icon } = payload;

  let finalBalance = 0;
  if (balance !== undefined && balance !== null) {
    finalBalance = parseFloat(balance);
  } else if (initialBalance !== undefined && initialBalance !== null) {
    finalBalance = parseFloat(initialBalance);
  }

  if (isNaN(finalBalance)) finalBalance = 0;
  const data = {
    userId,
    name,
    type,
    balance: finalBalance,
    color,
    icon,
  };

  return walletRepo.create(data);
};

exports.list = async (userId, { page = 1, limit = 20 } = {}) => {
  const skip = (page - 1) * limit;

  const items = await prisma.wallet.findMany({
    where: {
      userId: userId,
      isArchived: false,
    },
    skip: skip,
    take: limit,
    orderBy: {
      createdAt: "desc",
    },
  });

  return { items };
};

exports.detail = async (id) => walletRepo.findById(id);

exports.update = async (id, payload, userId) => {
  const wallet = await walletRepo.findById(id);
  if (!wallet)
    throw Object.assign(new Error("Wallet not found"), { status: 404 });
  if (wallet.userId !== userId)
    throw Object.assign(new Error("Forbidden access"), { status: 403 });

  return walletRepo.update(id, payload);
};

exports.remove = async (id, userId) => {
  const wallet = await walletRepo.findById(id);
  if (!wallet)
    throw Object.assign(new Error("Wallet not found"), { status: 404 });
  if (wallet.userId !== userId)
    throw Object.assign(new Error("Forbidden access"), { status: 403 });

  return walletRepo.remove(id);
};

exports.getStats = async (walletId, userId, { month, year } = {}) => {
  // 1. Verify Wallet Ownership
  const wallet = await walletRepo.findById(walletId);
  if (!wallet)
    throw Object.assign(new Error("Wallet not found"), { status: 404 });
  if (wallet.userId !== userId)
    throw Object.assign(new Error("Forbidden access"), { status: 403 });

  // 2. Build Date Filter
  const now = new Date();
  const targetYear = year ? Number(year) : now.getFullYear();
  const targetMonth = month ? Number(month) : now.getMonth() + 1; // 1-12

  const startDate = new Date(targetYear, targetMonth - 1, 1);
  const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

  // 3. Aggregate Data
  const stats = await prisma.transaction.groupBy({
    by: ["type"],
    where: {
      walletId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    _sum: {
      amount: true,
    },
  });

  // 4. Format Result
  let totalIncome = 0;
  let totalExpense = 0;

  stats.forEach((item) => {
    if (item.type === "INCOME") {
      totalIncome = item._sum.amount || 0;
    } else if (item.type === "EXPENSE") {
      totalExpense = item._sum.amount || 0;
    }
  });

  return {
    walletId,
    period: { month: targetMonth, year: targetYear },
    totalIncome,
    totalExpense,
    netBalance: totalIncome - totalExpense,
  };
};

exports.getDailyStats = async (walletId, userId, { month, year } = {}) => {
  // 1. Verify Ownership
  const wallet = await walletRepo.findById(walletId);
  if (!wallet)
    throw Object.assign(new Error("Wallet not found"), { status: 404 });
  if (wallet.userId !== userId)
    throw Object.assign(new Error("Forbidden access"), { status: 403 });

  // 2. Build Date Range
  const now = new Date();
  const targetYear = year ? Number(year) : now.getFullYear();
  const targetMonth = month ? Number(month) : now.getMonth() + 1;

  const startDate = new Date(targetYear, targetMonth - 1, 1);
  const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

  // 3. get all transactions for this month (id, type, amount, dateOnly)
  // Note: Prisma groupBy doesn't support "day of date" easily in all DBs without raw query.
  // For portability and simplicity (since n < 1000/month usually), we fetch and map in JS.
  const transactions = await prisma.transaction.findMany({
    where: {
      walletId,
      date: { gte: startDate, lte: endDate },
    },
    select: {
      type: true,
      amount: true,
      date: true,
    },
    orderBy: { date: "asc" },
  });

  // 4. Group by Date
  const dailyMap = {};

  // Initialize all days of month? Or just days with transaction?
  // Ideally all days for chart continuity.
  const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${targetYear}-${String(targetMonth).padStart(
      2,
      "0"
    )}-${String(d).padStart(2, "0")}`;
    dailyMap[dateStr] = { date: dateStr, income: 0, expense: 0 };
  }

  transactions.forEach((tx) => {
    // tx.date is Date object
    const dateStr = tx.date.toISOString().split("T")[0]; // YYYY-MM-DD
    if (dailyMap[dateStr]) {
      if (tx.type === "INCOME") dailyMap[dateStr].income += tx.amount;
      if (tx.type === "EXPENSE") dailyMap[dateStr].expense += tx.amount;
    }
  });

  return Object.values(dailyMap);
};

exports.archiveWallet = async (walletId, userId) => {
  const wallet = await prisma.wallet.findFirst({
    where: {
      id: walletId,
      userId: userId,
    },
  });

  if (!wallet) {
    throw new Error("Dompet tidak ditemukan atau bukan milik Anda.");
  }

  if (wallet.balance > 1) {
    throw new Error(
      "Gagal Arsip: Saldo dompet harus Rp 0. Silakan transfer sisa saldo ke dompet lain terlebih dahulu."
    );
  }

  const updatedWallet = await prisma.wallet.update({
    where: {
      id: walletId,
    },
    data: {
      isArchived: true,
    },
  });

  return updatedWallet;
};
