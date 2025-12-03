const fs = require("fs");
const path = require("path");
const mime = require("mime-types");

// Cek folder dan buat jika belum ada
exports.ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Validasi mime type asli (anti file rename)
exports.isValidMime = (mimeType) => {
  return ["image/jpeg", "image/png", "image/webp"].includes(mimeType);
};

// Generate folder berdasarkan tahun/bulan
exports.buildFolderPath = (baseFolder) => {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, "0");
  return path.join("uploads", baseFolder, `${year}`, `${month}`);
};

// Generate file name unik
exports.generateFileName = (ext) => {
  const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  return `${unique}${ext}`;
};
