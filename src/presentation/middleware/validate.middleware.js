module.exports = (schema) => (req, res, next) => {
  const data = req.is("multipart/form-data") ? req.body : req.body;
  const { error } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details.map((d) => d.message).join("; "),
      errors: error.details,
    });
  }
  next();
};
