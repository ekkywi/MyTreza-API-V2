const prisma = require("../infrastructure/prismaClient");

exports.getProfile = async (userId) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      email: true,
      avatarUrl: true,
      currency: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

exports.updateProfile = async (userId, data) => {
  return prisma.user.update({
    where: { id: userId },
    data: data,
    select: {
      id: true,
      fullName: true,
      email: true,
      avatarUrl: true,
      currency: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

exports.changePassword = async (userId, oldPassword, newPassword) => {
  const { compare, hash } = require("../utils/password");

  // 1. Get user to check old password
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw Object.assign(new Error("User not found"), { status: 404 });

  // 2. Verify old password
  const isValid = await compare(oldPassword, user.password);
  if (!isValid) {
    throw Object.assign(new Error("Invalid old password"), { status: 400 });
  }

  // 3. Hash new password
  const hashedPassword = await hash(newPassword);

  // 4. Update password
  return prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });
};

exports.deleteAccount = async (userId) => {
  return prisma.$transaction(async (tx) => {
    // 1. Delete Budgets
    await tx.budgetCategory.deleteMany({ where: { userId } });
    await tx.budgetMonthly.deleteMany({ where: { userId } });

    // 2. Delete Transactions
    await tx.transaction.deleteMany({ where: { userId } });

    // 3. Delete Transfers (Both as sender and receiver)
    // Note: Transfer model has userId field, so we just delete by that
    await tx.transfer.deleteMany({ where: { userId } });

    // 4. Delete Wallets
    await tx.wallet.deleteMany({ where: { userId } });

    // 5. Delete Custom Categories
    await tx.category.deleteMany({ where: { userId } });

    // 6. Delete Refresh Token
    await tx.refreshToken.deleteMany({ where: { userId } });

    // 7. Delete User
    return tx.user.delete({ where: { id: userId } });
  });
};

exports.updateAvatar = async (userId, fileUrl) => {
  return prisma.user.update({
    where: { id: userId },
    data: { avatarUrl: fileUrl },
  });
};
