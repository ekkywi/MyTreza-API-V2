const debtService = require("../../services/debt.service");
const { success } = require("../../utils/response");

exports.create = async (req, res, next) => {
    try {
        const debt = await debtService.create(req.user.id, req.body);
        return success(res, "Debt record created", debt, 201);
    } catch (err) {
        next(err);
    }
};

exports.list = async (req, res, next) => {
    try {
        const debts = await debtService.list(req.user.id);
        return success(res, "Debt records fetched", debts);
    } catch (err) {
        next(err);
    }
};

exports.detail = async (req, res, next) => {
    try {
        const debt = await debtService.detail(req.params.id, req.user.id);
        return success(res, "Debt detail", debt);
    } catch (err) {
        next(err);
    }
};

exports.update = async (req, res, next) => {
    try {
        const debt = await debtService.update(req.params.id, req.user.id, req.body);
        return success(res, "Debt record updated", debt);
    } catch (err) {
        next(err);
    }
};

exports.remove = async (req, res, next) => {
    try {
        await debtService.remove(req.params.id, req.user.id);
        return success(res, "Debt record deleted", null, 200);
    } catch (err) {
        next(err);
    }
};

exports.pay = async (req, res, next) => {
    try {
        const result = await debtService.pay(req.params.id, req.user.id, req.body);
        return success(res, "Payment recorded", result);
    } catch (err) {
        next(err);
    }
};
