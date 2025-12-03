const prisma = require("../infrastructure/prismaClient");

exports.create = async (data) => prisma.category.create({ data });

exports.listByUser = async (userId) =>
  prisma.category.findMany({
    where: { OR: [{ userId }, { userId: null }] },
    orderBy: { name: "asc" },
  });

exports.update = async (id, data) =>
  prisma.category.update({ where: { id }, data });

exports.remove = async (id) => prisma.category.delete({ where: { id } });
