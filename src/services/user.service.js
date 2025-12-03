const prisma = require("../infrastructure/prismaClient");

exports.updateAvatar = async (userId, fileUrl) => {
  return prisma.user.update({
    where: { id: userId },
    data: { avatarUrl: fileUrl },
  });
};
