const prisma = require("../prismaClient");

const defaultCategories = [
  // EXPENSE CATEGORIES
  {
    name: "Makanan & Minuman",
    type: "EXPENSE",
    icon: "fastfood",
    color: "#E91E63",
  },
  { name: "Transportasi", type: "EXPENSE", icon: "car", color: "#E91E63" },
  { name: "Belanja", type: "EXPENSE", icon: "shopping", color: "#E91E63" },
  { name: "Tagihan", type: "EXPENSE", icon: "receipt", color: "#E91E63" },
  { name: "Hiburan", type: "EXPENSE", icon: "movie", color: "#E91E63" },
  { name: "Kesehatan", type: "EXPENSE", icon: "medical", color: "#E91E63" },
  { name: "Pendidikan", type: "EXPENSE", icon: "school", color: "#E91E63" },
  { name: "Rumah Tangga", type: "EXPENSE", icon: "home", color: "#E91E63" },
  {
    name: "Transfer Antar Wallet",
    type: "EXPENSE",
    icon: "swap_horiz",
    color: "#E91E63",
  },
  { name: "Transfer Keluar", type: "EXPENSE", icon: "send", color: "#E91E63" },
  {
    name: "Lainnya (Pengeluaran)",
    type: "EXPENSE",
    icon: "more_horiz",
    color: "#E91E63",
  },

  // INCOME CATEGORIES
  { name: "Gaji", type: "INCOME", icon: "work", color: "#8BC34A" },
  { name: "Bonus", type: "INCOME", icon: "gift", color: "#8BC34A" },
  { name: "Freelance", type: "INCOME", icon: "laptop", color: "#8BC34A" },
  { name: "Penjualan", type: "INCOME", icon: "sell", color: "#8BC34A" },
  {
    name: "Transfer Antar Wallet",
    type: "INCOME",
    icon: "swap_horiz",
    color: "#8BC34A",
  },
  {
    name: "Lainnya (Pemasukan)",
    type: "INCOME",
    icon: "more_horiz",
    color: "#8BC34A",
  },
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
