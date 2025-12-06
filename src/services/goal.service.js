const prisma = require("../infrastructure/prismaClient");
const walletRepo = require("../repositories/wallet.repository");

exports.create = async (userId, data) => {
    return prisma.goal.create({
        data: {
            userId,
            ...data,
        },
    });
};

exports.list = async (userId) => {
    return prisma.goal.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
    });
};

exports.detail = async (id, userId) => {
    const goal = await prisma.goal.findUnique({ where: { id } });
    if (!goal) throw Object.assign(new Error("Goal not found"), { status: 404 });
    if (goal.userId !== userId)
        throw Object.assign(new Error("Forbidden access"), { status: 403 });
    return goal;
};

exports.update = async (id, userId, data) => {
    const goal = await prisma.goal.findUnique({ where: { id } });
    if (!goal) throw Object.assign(new Error("Goal not found"), { status: 404 });
    if (goal.userId !== userId)
        throw Object.assign(new Error("Forbidden access"), { status: 403 });

    return prisma.goal.update({
        where: { id },
        data,
    });
};

exports.remove = async (id, userId) => {
    const goal = await prisma.goal.findUnique({ where: { id } });
    if (!goal) throw Object.assign(new Error("Goal not found"), { status: 404 });
    if (goal.userId !== userId)
        throw Object.assign(new Error("Forbidden access"), { status: 403 });

    // Optional: Check if goal has funds? For now, we allow deleting even if it has funds.
    // The funds are technically "gone" from wallet perspective anyway.
    // Or we could force withdraw first. Let's keep it simple for MVP.

    return prisma.goal.delete({ where: { id } });
};

exports.allocate = async (id, userId, { walletId, amount }) => {
    return prisma.$transaction(async (tx) => {
        // 1. Get Goal & Wallet
        const goal = await tx.goal.findUnique({ where: { id } });
        if (!goal) throw Object.assign(new Error("Goal not found"), { status: 404 });
        if (goal.userId !== userId)
            throw Object.assign(new Error("Forbidden access"), { status: 403 });

        const wallet = await tx.wallet.findUnique({ where: { id: walletId } });
        if (!wallet)
            throw Object.assign(new Error("Wallet not found"), { status: 404 });
        if (wallet.userId !== userId)
            throw Object.assign(new Error("Forbidden access"), { status: 403 });

        // 2. Check Balance
        if (wallet.balance < amount) {
            throw Object.assign(new Error("Insufficient wallet balance"), {
                status: 400,
            });
        }

        // 3. Create Expense Transaction (Money leaves wallet)
        await tx.transaction.create({
            data: {
                userId,
                walletId,
                type: "EXPENSE",
                amount,
                description: `Saved to goal: ${goal.name}`,
                date: new Date(),
            },
        });

        // 4. Update Wallet Balance
        await tx.wallet.update({
            where: { id: walletId },
            data: { balance: wallet.balance - amount },
        });

        // 5. Update Goal Amount
        return tx.goal.update({
            where: { id },
            data: { currentAmount: goal.currentAmount + amount },
        });
    });
};

exports.withdraw = async (id, userId, { walletId, amount }) => {
    return prisma.$transaction(async (tx) => {
        // 1. Get Goal & Wallet
        const goal = await tx.goal.findUnique({ where: { id } });
        if (!goal) throw Object.assign(new Error("Goal not found"), { status: 404 });
        if (goal.userId !== userId)
            throw Object.assign(new Error("Forbidden access"), { status: 403 });

        const wallet = await tx.wallet.findUnique({ where: { id: walletId } });
        if (!wallet)
            throw Object.assign(new Error("Wallet not found"), { status: 404 });
        if (wallet.userId !== userId)
            throw Object.assign(new Error("Forbidden access"), { status: 403 });

        // 2. Check Goal Balance
        if (goal.currentAmount < amount) {
            throw Object.assign(new Error("Insufficient goal funds"), {
                status: 400,
            });
        }

        // 3. Create Income Transaction (Money returns to wallet)
        await tx.transaction.create({
            data: {
                userId,
                walletId,
                type: "INCOME",
                amount,
                description: `Withdrawn from goal: ${goal.name}`,
                date: new Date(),
            },
        });

        // 4. Update Wallet Balance
        await tx.wallet.update({
            where: { id: walletId },
            data: { balance: wallet.balance + amount },
        });

        // 5. Update Goal Amount
        return tx.goal.update({
            where: { id },
            data: { currentAmount: goal.currentAmount - amount },
        });
    });
};
