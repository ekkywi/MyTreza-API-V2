const prisma = require("../infrastructure/prismaClient");

// ===== Monthly Budget =====
exports.upsertMonthly = async ({ userId, month, year, amount }) => {
  return prisma.budgetMonthly.upsert({
    where: {
      userId_month_year: {
        userId,
        month,
        year,
      },
    },
    update: { amount },
    create: { userId, month, year, amount },
  });
};

exports.getMonthly = async ({ userId, month, year }) => {
  return prisma.budgetMonthly.findUnique({
    where: {
      userId_month_year: { userId, month, year },
    },
  });
};

// ==== Category Budget =====
exports.upsertCategory = async ({
  userId,
  categoryId,
  month,
  year,
  amount,
}) => {
  return prisma.budgetCategory.upsert({
    where: {
      userId_categoryId_month_year: {
        userId,
        categoryId,
        month,
        year,
      },
    },
    update: { amount },
    create: { userId, categoryId, month, year, amount },
  });
};

exports.getCategoryBudgets = async ({ userId, month, year }) => {
  return prisma.budgetCategory.findMany({
    where: { userId, month, year },
    include: {
      category: true,
    },
  });
};
