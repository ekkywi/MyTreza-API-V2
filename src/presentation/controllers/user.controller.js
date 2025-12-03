const { success } = require("../../utils/response");
const userService = require("../../services/user.service");

exports.getProfile = async (req, res, next) => {
  try {
    return success(res, "User profile - implement", null);
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    return success(res, "Update profile - implement", null);
  } catch (err) {
    next(err);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    return success(res, "Change password - implement", null);
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
