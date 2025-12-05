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
  if (!user) throw new Error("User tidak ditemukan");

  // 2. Verify old password
  const isValid = await compare(oldPassword, user.password);
  if (!isValid) {
    throw Object.assign(new Error("Password lama salah"), { status: 400 });
  }

  // 3. Hash new password
  const hashedPassword = await hash(newPassword);

  // 4. Update password
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  return true;
};

exports.updateAvatar = async (userId, fileUrl) => {
  return prisma.user.update({
    where: { id: userId },
    data: { avatarUrl: fileUrl },
  });
};
