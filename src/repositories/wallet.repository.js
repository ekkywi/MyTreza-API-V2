const prisma = require("../infrastructure/prismaClient");

exports.create = async (data) => prisma.wallet.create({ data });

exports.findById = async (id) => prisma.wallet.findUnique({ where: { id } });

exports.findByUser = async (userId, { skip = 0, take = 100 } = {}) =>
  prisma.wallet.findMany({
    where: { userId },
    skip,
    take,
    orderBy: { createdAt: "desc" },
  });

exports.update = async (id, data) =>
  prisma.wallet.update({ where: { id }, data });

exports.remove = async (id) => prisma.wallet.delete({ where: { id } });

// helper to increment/decrement balance atomically
exports.updateBalance = async (id, newBalance) =>
  prisma.wallet.update({ where: { id }, data: { balance: newBalance } });
