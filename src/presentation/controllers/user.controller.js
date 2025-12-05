const { success } = require("../../utils/response");
const userService = require("../../services/user.service");

exports.getProfile = async (req, res, next) => {
  try {
    const user = await userService.getProfile(req.user.id);
    return success(res, "Profil Pengguna", user);
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const updatedUser = await userService.updateProfile(req.user.id, req.body);
    return success(res, "Profil berhasil diperbarui", updatedUser);
  } catch (err) {
    next(err);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    await userService.changePassword(req.user.id, oldPassword, newPassword);
    return success(res, "Password berhasil diperbarui", null);
  } catch (err) {
    next(err);
  }
};

exports.uploadAvatar = async (req, res, next) => {
  try {
    if (!req.uploadedFileUrl) {
      return res
        .status(400)
        .json({ success: false, message: "Avatar belum diupload" });
    }

    const fileUrl = req.uploadedFileUrl;

    await userService.updateAvatar(req.user.id, fileUrl);

    return res.json({
      success: true,
      message: "Avatar berhasil diupdate",
      data: { avatarUrl: fileUrl },
    });
  } catch (err) {
    next(err);
  }
};
