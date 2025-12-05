const { success } = require('../../utils/response');
const categoryService = require('../../services/category.service');

exports.create = async (req, res, next) => {
  try {
    const category = await categoryService.create(req.user.id, req.body);
    return success(res, 'Category created', category, 201);
  } catch (err) {
    next(err);
  }
};

exports.list = async (req, res, next) => {
  try {
    const categories = await categoryService.list(req.user.id);
    return success(res, 'List categories', categories);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const updated = await categoryService.update(req.params.id, req.body, req.user.id);
    return success(res, 'Category updated', updated);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await categoryService.remove(req.params.id, req.user.id);
    return success(res, 'Category deleted', null, 200);
  } catch (err) {
    next(err);
  }
};
