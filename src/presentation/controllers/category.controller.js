const { success } = require('../../utils/response');

exports.create = async (req, res, next) => {
  try {
    return success(res, 'Create category - implement', null, 201);
  } catch (err) {
    next(err);
  }
};

exports.list = async (req, res, next) => {
  try {
    return success(res, 'List categories - implement', null);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    return success(res, 'Update category - implement', null);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    return success(res, 'Delete category - implement', null, 204);
  } catch (err) {
    next(err);
  }
};
