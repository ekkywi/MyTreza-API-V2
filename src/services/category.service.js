const categoryRepo = require("../repositories/category.repository");

exports.create = async (userId, data) => {
    return categoryRepo.create({ ...data, userId });
};

exports.list = async (userId) => {
    return categoryRepo.listByUser(userId);
};

exports.update = async (id, data) => {
    // TODO: Check ownership? For now just update
    return categoryRepo.update(id, data);
};

exports.remove = async (id) => {
    // TODO: Check ownership?
    return categoryRepo.remove(id);
};
