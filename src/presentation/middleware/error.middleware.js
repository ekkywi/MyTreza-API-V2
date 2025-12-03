const { error } = require('../../utils/response');

exports.errorHandler = (err, req, res, next) => {
  console.error(err);
  return error(res, err.message || 'Internal Server Error', err.status || 500);
};
