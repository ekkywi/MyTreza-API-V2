const budgetService = require("../../services/budget.service");
const { success } = require("../../utils/response");

exports.setMonthly = async (req, res, next) => {
  try {
    const result = await budgetService.setMonthlyBudget(req.user.id, req.body);
    return success(res, "Monthly budget saved", result, 201);
  } catch (err) {
    next(err);
  }
};

exports.getMonthly = async (req, res, next) => {
  try {
    const result = await budgetService.getMonthlyBudget(req.user.id, req.query);
    return success(res, "Monthly budget", result);
  } catch (err) {
    next(err);
  }
};

exports.setCategory = async (req, res, next) => {
  try {
    const result = await budgetService.setCategoryBudget(req.user.id, req.body);
    return success(res, "Category budget saved", result, 201);
  } catch (err) {
    next(err);
  }
};

exports.getCategories = async (req, res, next) => {
  try {
    const result = await budgetService.getCategoryBudgets(
      req.user.id,
      req.query
    );
    return success(res, "Category budgets", result);
  } catch (err) {
    next(err);
  }
};

exports.usage = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const result = await budgetService.getBudgetUsage(req.user.id, month, year);
    return success(res, "Budget usage", result);
  } catch (err) {
    next(err);
  }
};

exports.getRecommendations = async (req, res, next) => {
  try {
    const result = await budgetService.getRecommendations(req.user.id);
    return success(res, "Budget recommendations", result);
  } catch (err) {
    next(err);
  }
};
