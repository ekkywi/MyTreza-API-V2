const prisma = require("../prismaClient");

const defaultWallets = [
  { name: "Dompet Harian", type: "CASH" },
  { name: "Rekening Bank Utama", type: "BANK" },
  { name: "E-Wallet Utama", type: "EWALLET" },
];

async function seedUserWallets(userId) {
  console.log(`⏳ Seeding default wallets for user ${userId}`);

  for (const w of defaultWallets) {
    const exists = await prisma.wallet.findFirst({
      where: { userId, type: w.type },
    });

    // Supaya tiap user hanya punya 1 tipe wallet default
    if (!exists) {
      await prisma.wallet.create({
        data: {
          userId,
          name: w.name,
          type: w.type,
          balance: 0,
        },
      });

      console.log(`✔ Wallet created: ${w.name} (${w.type})`);
    }
  }

  console.log("✔ Default wallets ready.");
}

module.exports = seedUserWallets;
