const bcrypt = require("bcrypt");
const SALT_ROUNDS = 10;

exports.hash = async (plain) => {
  return await bcrypt.hash(plain, SALT_ROUNDS);
};

exports.compare = async (plain, hash) => {
  return await bcrypt.compare(plain, hash);
};
