const jwt = require("jsonwebtoken");
const userRepo = require("../../repositories/user.repository");

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader)
      return res
        .status(401)
        .json({ success: false, message: "Missing Authorization header" });
    const parts = authHeader.split(" ");
    if (parts.length !== 2)
      return res
        .status(401)
        .json({ success: false, message: "Invalid Authorization" });
    const token = parts[1];
    try {
      const payload = jwt.verify(
        token,
        process.env.JWT_SECRET || "mytreza_secret_key"
      );
      const user = await userRepo.findById(payload.sub);
      if (!user)
        return res
          .status(401)
          .json({ success: false, message: "User not found" });
      req.user = { id: user.id };
      next();
    } catch (err) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid or expired token" });
    }
  } catch (err) {
    next(err);
  }
};
