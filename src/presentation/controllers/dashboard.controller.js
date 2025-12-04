const dashboardService = require("../../services/dashboard.service");
const { success } = require("../../utils/response");

exports.summary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const data = await dashboardService.getSummary(userId);

    return success(res, "Dashboard summary fetched", data);
  } catch (err) {
    next(err);
  }
};
