const prisma = require("../../infrastructure/prismaClient");
const { success } = require("../../utils/response");

exports.summary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    // wallets sum
    const wallets = await prisma.wallet.findMany({ where: { userId } });
    const netWorth = wallets.reduce((s, w) => s + (w.balance || 0), 0);
    // income & expense this month
    const month = Number(req.query.month) || new Date().getMonth() + 1;
    const year = Number(req.query.year) || new Date().getFullYear();
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);
    const aggr = await prisma.transaction.groupBy({
      by: ["type"],
      where: { userId, date: { gte: start, lte: end } },
      _sum: { amount: true },
    });
    let totalIncome = 0,
      totalExpense = 0;
    aggr.forEach((a) => {
      if (a.type === "INCOME") totalIncome = a._sum.amount || 0;
      else if (a.type === "EXPENSE") totalExpense = a._sum.amount || 0;
    });
    // best category
    const best =
      await prisma.$queryRaw`SELECT "categoryId", SUM(amount) as total FROM "Transaction" WHERE "userId" = ${userId} GROUP BY "categoryId" ORDER BY total DESC LIMIT 1;`;
    let bestCategory = null;
    if (best && best.length > 0 && best[0].categoryId) {
      const cat = await prisma.category.findUnique({
        where: { id: best[0].categoryId },
      });
      bestCategory = {
        name: cat ? cat.name : "Unknown",
        amount: Number(best[0].total),
      };
    }

    return success(res, "Dashboard summary", {
      netWorth,
      totalIncome,
      totalExpense,
      walletsCount: wallets.length,
      bestCategory,
    });
  } catch (err) {
    next(err);
  }
};
