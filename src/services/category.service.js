const categoryRepo = require("../repositories/category.repository");

exports.create = async (userId, data) => {
    return categoryRepo.create({ ...data, userId });
};

exports.list = async (userId) => {
    return categoryRepo.listByUser(userId);
};

exports.update = async (id, data, userId) => {
    // Check ownership
    const category = await categoryRepo.findById(id);
    if (!category) throw Object.assign(new Error("Category not found"), { status: 404 });

    // Allow update if user owns it OR if it's a global category (userId is null) - Policy decision: Users can't update global
    if (category.userId && category.userId !== userId) {
        throw Object.assign(new Error("Forbidden access"), { status: 403 });
    }
    if (!category.userId) {
        throw Object.assign(new Error("Cannot update global category"), { status: 403 });
    }

    return categoryRepo.update(id, data);
};

exports.remove = async (id, userId) => {
    // Check ownership
    const category = await categoryRepo.findById(id);
    if (!category) throw Object.assign(new Error("Category not found"), { status: 404 });

    if (category.userId && category.userId !== userId) {
        throw Object.assign(new Error("Forbidden access"), { status: 403 });
    }
    if (!category.userId) {
        throw Object.assign(new Error("Cannot delete global category"), { status: 403 });
    }

    return categoryRepo.remove(id);
};
