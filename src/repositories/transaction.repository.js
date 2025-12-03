const prisma = require("../infrastructure/prismaClient");

exports.create = async (data) => prisma.transaction.create({ data });

exports.findById = async (id) =>
  prisma.transaction.findUnique({ where: { id } });

exports.list = async ({
  userId,
  walletId,
  categoryId,
  type,
  startDate,
  endDate,
  skip = 0,
  take = 20,
}) => {
  const where = { userId };
  if (walletId) where.walletId = walletId;
  if (categoryId) where.categoryId = categoryId;
  if (type) where.type = type;
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }
  const items = await prisma.transaction.findMany({
    where,
    skip,
    take,
    orderBy: { date: "desc" },
  });
  const total = await prisma.transaction.count({ where });
  return { items, total };
};

exports.update = async (id, data) =>
  prisma.transaction.update({ where: { id }, data });

exports.remove = async (id) => prisma.transaction.delete({ where: { id } });
