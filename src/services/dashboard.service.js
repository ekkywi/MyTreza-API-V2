const prisma = require("../infrastructure/prismaClient");

exports.getDashboardData = async (userId, month, year) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  // 1. Summary (Income, Expense, Balance)
  const incomeAgg = await prisma.transaction.aggregate({
    _sum: { amount: true },
    where: { userId, type: "INCOME", date: { gte: startDate, lt: endDate } },
  });
  const expenseAgg = await prisma.transaction.aggregate({
    _sum: { amount: true },
    where: { userId, type: "EXPENSE", date: { gte: startDate, lt: endDate } },
  });

  const totalIncome = incomeAgg._sum.amount || 0;
  const totalExpense = expenseAgg._sum.amount || 0;
  const netBalance = totalIncome - totalExpense;

  // 2. Daily Trend (Line Chart)
  // Group by day is tricky in Prisma without raw SQL for specific DBs.
  // For simplicity/compatibility, we fetch all expenses and aggregate in JS.
  const expenses = await prisma.transaction.findMany({
    where: { userId, type: "EXPENSE", date: { gte: startDate, lt: endDate } },
    select: { amount: true, date: true },
  });

  const dailyMap = {};
  // Initialize all days in month
  const daysInMonth = new Date(year, month, 0).getDate();
  for (let i = 1; i <= daysInMonth; i++) {
    dailyMap[i] = 0;
  }

  expenses.forEach((t) => {
    const day = t.date.getDate();
    dailyMap[day] += t.amount;
  });

  const trend = Object.keys(dailyMap).map((day) => ({
    day: Number(day),
    amount: dailyMap[day],
  }));

  // 3. Category Breakdown (Pie Chart)
  const categoryAgg = await prisma.transaction.groupBy({
    by: ["categoryId"],
    _sum: { amount: true },
    where: {
      userId,
      type: "EXPENSE",
      date: { gte: startDate, lt: endDate },
      // Include uncategorized items
    },
  });

  const breakdown = [];
  for (const item of categoryAgg) {
    if (item.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: item.categoryId },
      });
      if (category) {
        breakdown.push({
          categoryId: category.id,
          label: category.name,
          value: item._sum.amount || 0,
          color: category.color || "#cccccc",
        });
      }
    } else {
      // Handle uncategorized as "Lainnya"
      breakdown.push({
        categoryId: "uncategorized",
        label: "Lainnya",
        value: item._sum.amount || 0,
        color: "#9e9e9e", // Neutral Grey
      });
    }
  }

  return {
    summary: {
      totalIncome,
      totalExpense,
      netBalance,
    },
    trend,
    breakdown,
  };
};
