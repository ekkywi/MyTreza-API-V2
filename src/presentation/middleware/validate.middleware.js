module.exports = (schema) => (req, res, next) => {
  const isGet = req.method === "GET";
  const data = isGet
    ? req.query
    : req.is("multipart/form-data")
      ? req.body
      : req.body;

  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
    convert: true, // ensure type conversion happens
  });

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details.map((d) => d.message).join("; "),
      errors: error.details,
    });
  }

  if (isGet) {
    req.query = value;
  } else {
    req.body = value;
  }
  next();
};
