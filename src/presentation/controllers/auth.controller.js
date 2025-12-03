const authService = require("../../services/auth.service");
const { success, error } = require("../../utils/response");

exports.register = async (req, res, next) => {
  try {
    const user = await authService.register(req.body);
    return success(res, "Pengguna berhasil didaftarkan", { id: user.id }, 201);
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { user, accessToken, refreshToken } = await authService.login(
      req.body
    );
    return success(res, "Login berhasil", {
      user: { id: user.id, fullName: user.fullName, email: user.email },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    next(err);
  }
};

exports.refresh = async (req, res, next) => {
  try {
    const payload = await authService.refresh(req.body);
    return success(res, "Token berhasil direfresh", payload);
  } catch (err) {
    next(err);
  }
};
