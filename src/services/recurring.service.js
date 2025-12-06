const prisma = require("../infrastructure/prismaClient");

exports.create = async (userId, data) => {
    let nextRun = new Date(data.startDate);
    const now = new Date();

    // If start date is in the past, calculate the next future run
    if (nextRun < now) {
        while (nextRun < now) {
            if (data.frequency === "DAILY") {
                nextRun.setDate(nextRun.getDate() + 1);
            } else if (data.frequency === "WEEKLY") {
                nextRun.setDate(nextRun.getDate() + 7);
            } else if (data.frequency === "MONTHLY") {
                nextRun.setMonth(nextRun.getMonth() + 1);
            } else if (data.frequency === "YEARLY") {
                nextRun.setFullYear(nextRun.getFullYear() + 1);
            }
        }
    }

    return prisma.recurringTransaction.create({
        data: {
            userId,
            ...data,
            nextRun,
        },
    });
};

exports.list = async (userId) => {
    return prisma.recurringTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: { wallet: true, category: true },
    });
};

exports.update = async (id, userId, data) => {
    const rule = await prisma.recurringTransaction.findUnique({ where: { id } });
    if (!rule) throw Object.assign(new Error("Rule not found"), { status: 404 });
    if (rule.userId !== userId)
        throw Object.assign(new Error("Forbidden access"), { status: 403 });

    return prisma.recurringTransaction.update({
        where: { id },
        data,
    });
};

exports.remove = async (id, userId) => {
    const rule = await prisma.recurringTransaction.findUnique({ where: { id } });
    if (!rule) throw Object.assign(new Error("Rule not found"), { status: 404 });
    if (rule.userId !== userId)
        throw Object.assign(new Error("Forbidden access"), { status: 403 });

    return prisma.recurringTransaction.delete({ where: { id } });
};
