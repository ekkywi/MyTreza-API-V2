const dashboardService = require("../../services/dashboard.service");
const { success } = require("../../utils/response");

exports.getDashboard = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    // Default to current month/year if not provided
    const now = new Date();
    const m = month ? Number(month) : now.getMonth() + 1;
    const y = year ? Number(year) : now.getFullYear();

    const result = await dashboardService.getDashboardData(req.user.id, m, y);
    return success(res, "Dashboard data", result);
  } catch (err) {
    next(err);
  }
};
