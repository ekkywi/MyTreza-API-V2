const prisma = require("../infrastructure/prismaClient");

exports.upsert = async ({ userId, token, expiresAt }) => {
  return prisma.refreshToken.upsert({
    where: { userId },
    update: { token, expiresAt },
    create: { userId, token, expiresAt },
  });
};

exports.findByToken = async (token) =>
  prisma.refreshToken.findUnique({ where: { token } });

exports.deleteByUser = async (userId) =>
  prisma.refreshToken.deleteMany({ where: { userId } });
