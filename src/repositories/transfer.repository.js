const prisma = require("../infrastructure/prismaClient");

exports.create = async (data) => prisma.transfer.create({ data });

exports.listByUser = async ({ userId, skip = 0, take = 20 }) =>
  prisma.transfer.findMany({
    where: { userId },
    skip,
    take,
    orderBy: { createdAt: "desc" },
  });
