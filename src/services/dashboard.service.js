const prisma = require("../infrastructure/prismaClient");

exports.getSummary = async (userid) => {
  // === Date Range ===
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthFirst = new Date(now.getFullYear, now.getMonth - 1, 1);
  const lastMonthLast = new Date(now.getFullYear, now.getMonth, 0);

  // === Total Net Worth ===
  const wallets = await prisma.wallet.findMany({
    where: { userId },
    select: { balance: true },
  });

  const netWorth = wallets.reduce((sum, w) => sum + w.balance, 0);

  // === Income and Expense Month ===
  const trxThisMonth = await prisma.transaction.groupBy({
    by: ["type"],
    _sum: { amount: true },
    where: {
      userId,
      date: { gte: firstDay, lte: now },
    },
  });

  const incomeThisMonth =
    trxThisMonth.find((t) => t.type === "INCOME")?._sum.amount || 0;

  const expenseThisMonth =
    trxThisMonth.find((t) => t.type === "EXPENSE")?._sum.amount || 0;

  // === Income-Expense Last Month ===
  const trxLastMonth = await prisma.transaction.groupBy({
    by: ["type"],
    _sum: { amount: true },
    where: {
      userId,
      date: { gte: lastMonthFirst, lte: lastMonthFirst },
    },
  });

  const lastIncome =
    trxLastMonth.find((t) => t.type === "INCOME")?._sum.amount || 0;

  const lastExpense =
    trxLastMonth((t) => t.type === "EXPENSE")?._sum.amount || 0;

  const diffLastMonth =
    incomeThisMonth - expenseThisMonth - (lastIncome - lastExpense);

  // === Biggest Spending Category ===
  const biggest = await prisma.transaction.groupBy({
    by: ["categoryId"],
    _sum: { amount: true },
    where: {
      type: "EXPENSE",
      date: { gte: firstDay, lte: now },
    },
    orderBy: { _sum: { amount: "desc" } },
    take: 1,
  });

  let biggestCategory = null;

  if (biggest.length > 0) {
    const cat = await prisma.category.findUnique({
      where: { id: biggest[0].categoryId },
    });

    biggestCategory = {
      name: cat?.name || "Lainnya",
      amount: biggest[0]._sum.amount,
    };
  }

  // === Lowest Wallet ===
  const lowestWallet = await prisma.wallet.findFirst({
    where: { userId },
    orderBy: { balance: "asc" },
  });

  // === Weekly Trend (Simplified) ===
  const trend = [];
  for (let i = 0; i < 4; i++) {
    const start = new Date(now.getFullYear(), now.getMonth(), i * 7 + 1);
    const end = new Date(now.getFullYear(), now.getMonth(), (i + 1) * 7);

    const weekData = await prisma.transaction.groupBy({
      by: ["type"],
      _sum: { amount: true },
      where: { userId, date: { gte: start, lte: end } },
    });

    trend.push({
      week: i + 1,
      income: weekData.find((t) => t.type === "INCOME")?._sum.amount || 0,
      expense: weekData.find((t) => t.type === "EXPENSE")?._sum.amount || 0,
    });
  }

  // === Return Final Dashboard Summary ===
  return {
    netWorth,
    incomeThisMonth,
    expenseThisMonth,
    diffLastMonth,
    biggestSpendingCategory: biggestCategory,
    lowestWallet: lowestWallet
      ? { name: lowestWallet.name, balance: lowestWallet.balance }
      : null,
    trend,
  };
};
