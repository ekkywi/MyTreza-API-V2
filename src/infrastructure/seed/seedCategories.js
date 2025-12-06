const prisma = require("../prismaClient");

const defaultCategories = [
  // EXPENSE CATEGORIES
  { name: "Makanan & Minuman", type: "EXPENSE", icon: "fastfood" },
  { name: "Transportasi", type: "EXPENSE", icon: "car" },
  { name: "Belanja", type: "EXPENSE", icon: "shopping" },
  { name: "Tagihan", type: "EXPENSE", icon: "receipt" },
  { name: "Hiburan", type: "EXPENSE", icon: "movie" },
  { name: "Kesehatan", type: "EXPENSE", icon: "medical" },
  { name: "Pendidikan", type: "EXPENSE", icon: "school" },
  { name: "Rumah Tangga", type: "EXPENSE", icon: "home" },
  { name: "Transfer Antar Wallet", type: "EXPENSE", icon: "swap_horiz" },
  { name: "Transfer Keluar", type: "EXPENSE", icon: "send" },
  { name: "Lainnya", type: "EXPENSE", icon: "more_horiz" },

  // INCOME CATEGORIES
  { name: "Gaji", type: "INCOME", icon: "work" },
  { name: "Bonus", type: "INCOME", icon: "gift" },
  { name: "Freelance", type: "INCOME", icon: "laptop" },
  { name: "Penjualan", type: "INCOME", icon: "sell" },
  { name: "Transfer Antar Wallet", type: "INCOME", icon: "swap_horiz" },
  { name: "Lainnya", type: "INCOME", icon: "more_horiz" },
];

async function seedCategories() {
  console.log("⏳ Seeding default categories...");

  for (const cat of defaultCategories) {
    const exists = await prisma.category.findFirst({
      where: { name: cat.name, type: cat.type },
    });

    if (!exists) {
      await prisma.category.create({ data: cat });
      console.log(`✔ Insert category: ${cat.name}`);
    }
  }

  console.log("✔ Category seeding complete.");
}

module.exports = seedCategories;
