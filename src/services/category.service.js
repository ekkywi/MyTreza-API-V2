const categoryRepo = require("../repositories/category.repository");
const prisma = require("../infrastructure/prismaClient");

exports.create = async (userId, data) => {
  const categoryData = {
    ...data,
    userId,
    icon: data.icon || "category",
    color: data.color || "#000000",
  };

  return categoryRepo.create(categoryData);
};

exports.list = async (userId) => {
  return await prisma.category.findMany({
    where: {
      OR: [{ userId: userId }, { userId: null }],
    },
    orderBy: {
      name: "asc",
    },
  });
};

exports.update = async (id, data, userId) => {
  const category = await categoryRepo.findById(id);
  if (!category)
    throw Object.assign(new Error("Category not found"), { status: 404 });

  if (category.userId && category.userId !== userId) {
    throw Object.assign(new Error("Forbidden access"), { status: 403 });
  }
  if (!category.userId) {
    throw Object.assign(new Error("Cannot update global category"), {
      status: 403,
    });
  }

  return categoryRepo.update(id, data);
};

exports.remove = async (id, userId) => {
  const category = await categoryRepo.findById(id);
  if (!category)
    throw Object.assign(new Error("Category not found"), { status: 404 });

  if (category.userId && category.userId !== userId) {
    throw Object.assign(new Error("Forbidden access"), { status: 403 });
  }
  if (!category.userId) {
    throw Object.assign(new Error("Cannot delete global category"), {
      status: 403,
    });
  }

  return categoryRepo.remove(id);
};
