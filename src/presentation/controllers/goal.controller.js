const goalService = require("../../services/goal.service");
const { success } = require("../../utils/response");

exports.create = async (req, res, next) => {
    try {
        const goal = await goalService.create(req.user.id, req.body);
        return success(res, "Goal created", goal, 201);
    } catch (err) {
        next(err);
    }
};

exports.list = async (req, res, next) => {
    try {
        const goals = await goalService.list(req.user.id);
        return success(res, "Goals fetched", goals);
    } catch (err) {
        next(err);
    }
};

exports.detail = async (req, res, next) => {
    try {
        const goal = await goalService.detail(req.params.id, req.user.id);
        return success(res, "Goal detail", goal);
    } catch (err) {
        next(err);
    }
};

exports.update = async (req, res, next) => {
    try {
        const goal = await goalService.update(req.params.id, req.user.id, req.body);
        return success(res, "Goal updated", goal);
    } catch (err) {
        next(err);
    }
};

exports.remove = async (req, res, next) => {
    try {
        await goalService.remove(req.params.id, req.user.id);
        return success(res, "Goal deleted", null, 200);
    } catch (err) {
        next(err);
    }
};

exports.allocate = async (req, res, next) => {
    try {
        const result = await goalService.allocate(
            req.params.id,
            req.user.id,
            req.body
        );
        return success(res, "Funds allocated to goal", result);
    } catch (err) {
        next(err);
    }
};

exports.withdraw = async (req, res, next) => {
    try {
        const result = await goalService.withdraw(
            req.params.id,
            req.user.id,
            req.body
        );
        return success(res, "Funds withdrawn from goal", result);
    } catch (err) {
        next(err);
    }
};
