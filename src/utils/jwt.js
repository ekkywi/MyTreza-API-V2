const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "mytreza_secret_key";
const ACCESS_EXPIRES = process.env.ACCESS_TOKEN_EXPIRES_IN || "15m";
const REFRESH_EXPIRES = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";

exports.signAccess = (payload) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_EXPIRES });
exports.verify = (token) => jwt.verify(token, JWT_SECRET);
exports.signRefresh = (payload) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_EXPIRES });
