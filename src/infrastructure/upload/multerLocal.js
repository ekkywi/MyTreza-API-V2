const multer = require("multer");

// SIMPAN SEBAGAI BUFFER, PROSES MANUAL KEMUDIAN
const storage = multer.memoryStorage();

module.exports = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 }, // Max 3MB
});
