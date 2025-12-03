const multer = require("multer");
const path = require("path");

const allowedImage = ["image/jpeg", "image/png", "image/webp"];

function createUploader(folder) {
  return multer({
    storage: multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, `uploads/${folder}`);
      },
      filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, `${unique}${ext}`);
      },
    }),

    fileFilter: (req, file, cb) => {
      if (!allowedImage.includes(file.mimetype)) {
        return cb(new Error("File harus berupa gambar (jpg, png, webp)"));
      }
      cb(null, true);
    },

    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  });
}

module.exports = createUploader;
