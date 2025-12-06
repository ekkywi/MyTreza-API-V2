const prisma = require("../infrastructure/prismaClient");

exports.create = async (userId, { title, message, type }) => {
    return prisma.notification.create({
        data: {
            userId,
            title,
            message,
            type: type || "INFO",
        },
    });
};

exports.list = async (userId, page = 1, limit = 20) => {
    const skip = (page - 1) * limit;
    const take = Number(limit);

    const [items, total] = await Promise.all([
        prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            skip,
            take,
        }),
        prisma.notification.count({ where: { userId } }),
    ]);

    return {
        items,
        meta: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

exports.markAsRead = async (id, userId) => {
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification)
        throw Object.assign(new Error("Notification not found"), { status: 404 });
    if (notification.userId !== userId)
        throw Object.assign(new Error("Forbidden access"), { status: 403 });

    return prisma.notification.update({
        where: { id },
        data: { isRead: true },
    });
};

exports.markAllAsRead = async (userId) => {
    return prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
    });
};

exports.remove = async (id, userId) => {
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification)
        throw Object.assign(new Error("Notification not found"), { status: 404 });
    if (notification.userId !== userId)
        throw Object.assign(new Error("Forbidden access"), { status: 403 });

    return prisma.notification.delete({ where: { id } });
};
