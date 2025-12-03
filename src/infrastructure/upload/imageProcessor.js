const sharp = require("sharp");

exports.processImage = async (buffer) => {
  return await sharp(buffer)
    .resize({
      width: 1080,
      withoutEnlargement: true,
    })
    .webp({ quality: 80 })
    .toBuffer();
};
