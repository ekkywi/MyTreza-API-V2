const prisma = require("../infrastructure/prismaClient");
const repo = require("../repositories/budget.repository");

exports.setMonthlyBudget = (userId, payload) => {
  return repo.upsertMonthly({ userId, ...payload });
};

exports.getMonthlyBudget = (userId, payload) => {
  return repo.getMonthly({ userId, ...payload });
};

exports.setCategoryBudget = (userId, payload) => {
  return repo.upsertCategory({ userId, ...payload });
};

exports.getCategoryBudgets = (userId, payload) => {
  return repo.getCategoryBudgets({ userId, ...payload });
};

exports.getBudgetUsage = async (userId, month, year) => {
  const monthly = await repo.getMonthly({ userId, month, year });

  const totalSpent = await prisma.transaction.aggregate({
    _sum: { amount: true },
    where: {
      userId,
      type: "EXPENSE",
      date: { gte: new Date(year, month - 1, 1), lt: new Date(year, month, 1) },
    },
  });

  const spent = totalSpent._sum.amount || 0;

  const categories = await repo.getCategoryBudgets({ userId, month, year });

  const details = [];

  for (const c of categories) {
    const catSpent = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        userId,
        categoryId: c.categoryId,
        type: "EXPENSE",
        date: {
          gte: new Date(year, month - 1, 1),
          lt: new Date(year, month, 1),
        },
      },
    });
    const s = catSpent._sum.amount || 0;

    // Calculate percentage and status
    const percentage = c.amount > 0 ? (s / c.amount) * 100 : 0;
    let status = "SAFE";
    if (percentage >= 100) status = "DANGER";
    else if (percentage >= 80) status = "WARNING";

    details.push({
      category: c.category.name,
      limit: c.amount,
      spent: s,
      remaining: c.amount - s,
      percentage: parseFloat(percentage.toFixed(2)),
      status,
    });
  }

  let monthlyData = null;
  if (monthly) {
    const percentage = monthly.amount > 0 ? (spent / monthly.amount) * 100 : 0;
    let status = "SAFE";
    if (percentage >= 100) status = "DANGER";
    else if (percentage >= 80) status = "WARNING";

    monthlyData = {
      limit: monthly.amount,
      spent,
      remaining: monthly.amount - spent,
      percentage: parseFloat(percentage.toFixed(2)),
      status,
    };
  }

  return {
    monthly: monthlyData,
    categories: details,
  };
};

exports.getRecommendations = async (userId) => {
  // Analyze last 3 months
  const now = new Date();
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

  const expenses = await prisma.transaction.groupBy({
    by: ["categoryId"],
    _sum: { amount: true },
    where: {
      userId,
      type: "EXPENSE",
      date: { gte: threeMonthsAgo },
      categoryId: { not: null },
    },
  });

  const recommendations = [];

  for (const exp of expenses) {
    const category = await prisma.category.findUnique({
      where: { id: exp.categoryId },
    });

    if (category) {
      const totalSpent = exp._sum.amount || 0;
      const averageSpent = totalSpent / 3;
      const suggestedAmount = Math.ceil(averageSpent * 1.1); // +10% buffer

      recommendations.push({
        categoryId: category.id,
        categoryName: category.name,
        averageSpent: Math.round(averageSpent),
        suggestedAmount,
      });
    }
  }

  return recommendations;
};
