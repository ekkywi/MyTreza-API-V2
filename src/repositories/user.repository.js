const prisma = require("../infrastructure/prismaClient");

exports.create = async ({ fullName, email, password }) => {
  return prisma.user.create({
    data: { fullName, email, password },
  });
};

exports.findByEmail = async (email) =>
  prisma.user.findUnique({ where: { email } });

exports.findById = async (id) => prisma.user.findUnique({ where: { id } });
