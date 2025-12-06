const notificationService = require("../../services/notification.service");
const { success } = require("../../utils/response");

exports.list = async (req, res, next) => {
    try {
        const { page, limit } = req.query;
        const result = await notificationService.list(req.user.id, page, limit);
        return success(res, "Notifications fetched", result);
    } catch (err) {
        next(err);
    }
};

exports.markAsRead = async (req, res, next) => {
    try {
        await notificationService.markAsRead(req.params.id, req.user.id);
        return success(res, "Notification marked as read", null, 200);
    } catch (err) {
        next(err);
    }
};

exports.markAllAsRead = async (req, res, next) => {
    try {
        await notificationService.markAllAsRead(req.user.id);
        return success(res, "All notifications marked as read", null, 200);
    } catch (err) {
        next(err);
    }
};

exports.remove = async (req, res, next) => {
    try {
        await notificationService.remove(req.params.id, req.user.id);
        return success(res, "Notification deleted", null, 200);
    } catch (err) {
        next(err);
    }
};
