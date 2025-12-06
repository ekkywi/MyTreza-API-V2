const recurringService = require("../../services/recurring.service");
const { success } = require("../../utils/response");

exports.create = async (req, res, next) => {
    try {
        const rule = await recurringService.create(req.user.id, req.body);
        return success(res, "Recurring rule created", rule, 201);
    } catch (err) {
        next(err);
    }
};

exports.list = async (req, res, next) => {
    try {
        const rules = await recurringService.list(req.user.id);
        return success(res, "Recurring rules fetched", rules);
    } catch (err) {
        next(err);
    }
};

exports.update = async (req, res, next) => {
    try {
        const rule = await recurringService.update(
            req.params.id,
            req.user.id,
            req.body
        );
        return success(res, "Recurring rule updated", rule);
    } catch (err) {
        next(err);
    }
};

exports.remove = async (req, res, next) => {
    try {
        await recurringService.remove(req.params.id, req.user.id);
        return success(res, "Recurring rule deleted", null, 200);
    } catch (err) {
        next(err);
    }
};
