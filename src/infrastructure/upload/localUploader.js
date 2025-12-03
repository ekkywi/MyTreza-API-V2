const fs = require("fs");
const path = require("path");
const {
  ensureDir,
  generateFileName,
  isValidMime,
  buildFolderPath,
} = require("./fileUtils");
const { processImage } = require("./imageProcessor");

exports.handleImageUpload = (baseFolder) => {
  return async (req, res, next) => {
    try {
      if (!req.file) return next();

      const mime = req.file.mimetype;

      if (!isValidMime(mime)) {
        throw new Error("File harus berupa gambar (jpg, png, webp)");
      }

      const folderPath = buildFolderPath(baseFolder);
      ensureDir(folderPath);

      const outputBuffer = await processImage(req.file.buffer);

      const fileName = generateFileName(".webp");
      const finalPath = path.join(folderPath, fileName);

      fs.writeFileSync(finalPath, outputBuffer);

      // Simpan URL untuk controller
      req.uploadedFileUrl = `/${finalPath.replace(/\\/g, "/")}`;

      next();
    } catch (err) {
      next(err);
    }
  };
};
