const prisma = require("../infrastructure/prismaClient");

exports.create = async (
  userId,
  { fromWalletId, toWalletId, amount, adminFee = 0, description, date }
) => {
  // 1. Validasi Dasar (Basic Validation)
  if (fromWalletId === toWalletId) {
    throw Object.assign(new Error("Cannot transfer to same wallet"), {
      status: 400,
    });
  }

  // Gunakan Transaction agar Atomic (Semua sukses atau batal semua)
  return prisma.$transaction(async (tx) => {
    const from = await tx.wallet.findUnique({ where: { id: fromWalletId } });
    const to = await tx.wallet.findUnique({ where: { id: toWalletId } });

    if (!from || !to) {
      throw Object.assign(new Error("Wallet not found"), { status: 404 });
    }

    // 2. Cek Kepemilikan (Security Check)
    if (from.userId !== userId || to.userId !== userId) {
      throw Object.assign(
        new Error("Forbidden: You can only transfer between your own wallets"),
        { status: 403 }
      );
    }

    // 3. Cek Saldo
    const transferAmount = Number(amount);
    const fee = Number(adminFee);
    const totalDeduction = transferAmount + fee;

    if (from.balance < totalDeduction) {
      throw Object.assign(
        new Error("Insufficient balance (including admin fee)"),
        { status: 400 }
      );
    }

    const transactionDate = date ? new Date(date) : new Date();

    // ---------------------------------------------------------
    // LOGIC "FIND OR CREATE" KATEGORI (Bagian yang Diperbaiki)
    // ---------------------------------------------------------

    // A. Cari/Buat Kategori Pengeluaran (EXPENSE) untuk Pengirim
    // Cari yang namanya mirip-mirip "Transfer"
    let expenseCategory = await tx.category.findFirst({
      where: {
        userId: userId, // Prioritaskan punya user sendiri
        type: "EXPENSE",
        name: { in: ["Transfer", "Transfer Keluar", "Transfer Antar Wallet"] },
      },
    });

    // Jika user belum punya, cari yang Global (System Default)
    if (!expenseCategory) {
      expenseCategory = await tx.category.findFirst({
        where: { userId: null, type: "EXPENSE", name: { contains: "Transfer" } },
      });
    }

    // JIKA MASIH KOSONG JUGA -> BUAT BARU OTOMATIS
    if (!expenseCategory) {
      expenseCategory = await tx.category.create({
        data: {
          userId, // Buat khusus untuk user ini
          name: "Transfer Keluar",
          type: "EXPENSE",
          icon: "transfer_out", // Pastikan string icon ini ada di Android (atau pakai icon default)
        },
      });
    }

    // B. Cari/Buat Kategori Pemasukan (INCOME) untuk Penerima
    let incomeCategory = await tx.category.findFirst({
      where: {
        userId: userId,
        type: "INCOME",
        name: { in: ["Transfer", "Transfer Masuk", "Transfer Antar Wallet"] },
      },
    });

    if (!incomeCategory) {
      incomeCategory = await tx.category.findFirst({
        where: { userId: null, type: "INCOME", name: { contains: "Transfer" } },
      });
    }

    if (!incomeCategory) {
      incomeCategory = await tx.category.create({
        data: {
          userId,
          name: "Transfer Masuk",
          type: "INCOME",
          icon: "transfer_in",
        },
      });
    }
    // ---------------------------------------------------------

    // 4. Buat Record Transfer (Link)
    const transferRecord = await tx.transfer.create({
      data: {
        userId,
        fromWalletId,
        toWalletId,
        amount: transferAmount,
        adminFee: fee,
        description,
        date: transactionDate,
      },
    });

    // 5. Update Saldo Dompet
    // Pengirim bayar Total (Nominal + Fee)
    await tx.wallet.update({
      where: { id: fromWalletId },
      data: { balance: { decrement: totalDeduction } },
    });

    // Penerima terima Nominal saja (Fee hangus/diambil sistem)
    await tx.wallet.update({
      where: { id: toWalletId },
      data: { balance: { increment: transferAmount } },
    });

    // 6. Catat Transaksi di Buku Pengirim (EXPENSE)
    await tx.transaction.create({
      data: {
        userId,
        walletId: fromWalletId,
        categoryId: expenseCategory.id, // ID Kategori Anti-Null
        type: "EXPENSE",
        amount: totalDeduction,
        description: `Transfer ke ${to.name} ${fee > 0 ? '(+Biaya Admin)' : ''}`,
        date: transactionDate,
      },
    });

    // 7. Catat Transaksi di Buku Penerima (INCOME)
    await tx.transaction.create({
      data: {
        userId,
        walletId: toWalletId,
        categoryId: incomeCategory.id, // ID Kategori Anti-Null
        type: "INCOME",
        amount: transferAmount,
        description: `Transfer dari ${from.name}`,
        date: transactionDate,
      },
    });

    return transferRecord;
  });
};

exports.list = ({ userId, page = 1, limit = 20 }) => {
  const skip = (page - 1) * limit;
  return prisma.transfer.findMany({
    where: { userId },
    include: {
        fromWallet: { select: { name: true } }, // Include nama wallet biar enak dibaca di frontend
        toWallet: { select: { name: true } }
    },
    skip,
    take: Number(limit),
    orderBy: { createdAt: "desc" },
  });
};