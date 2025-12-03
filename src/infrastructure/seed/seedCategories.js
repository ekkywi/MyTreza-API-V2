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

  // INCOME CATEGORIES
  { name: "Gaji", type: "INCOME", icon: "work" },
  { name: "Bonus", type: "INCOME", icon: "gift" },
  { name: "Freelance", type: "INCOME", icon: "laptop" },
  { name: "Penjualan", type: "INCOME", icon: "sell" },
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
