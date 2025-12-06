const prisma = require("../infrastructure/prismaClient");

exports.create = async (userId, data) => {
    return prisma.debt.create({
        data: {
            userId,
            ...data,
            remaining: data.amount, // Initially remaining equals amount
        },
    });
};

exports.list = async (userId) => {
    return prisma.debt.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
    });
};

exports.detail = async (id, userId) => {
    const debt = await prisma.debt.findUnique({ where: { id } });
    if (!debt) throw Object.assign(new Error("Debt not found"), { status: 404 });
    if (debt.userId !== userId)
        throw Object.assign(new Error("Forbidden access"), { status: 403 });
    return debt;
};

exports.update = async (id, userId, data) => {
    const debt = await prisma.debt.findUnique({ where: { id } });
    if (!debt) throw Object.assign(new Error("Debt not found"), { status: 404 });
    if (debt.userId !== userId)
        throw Object.assign(new Error("Forbidden access"), { status: 403 });

    // If amount is updated, we need to adjust remaining carefully.
    // For MVP, let's block amount update if payments exist, or just reset remaining?
    // To keep it simple: Update remaining only if amount changes and no payments made yet.
    // But for now, let's just allow updating fields other than amount/remaining for safety.
    // Or if user updates amount, we recalculate remaining?
    // Let's assume user knows what they are doing for now, but maybe restrict amount update.

    // Simplified: Allow updating details but if amount changes, reset remaining (dangerous).
    // Better: Only allow updating name, description, dueDate.

    const { amount, ...safeData } = data; // Ignore amount update for safety in this MVP step

    return prisma.debt.update({
        where: { id },
        data: safeData,
    });
};

exports.remove = async (id, userId) => {
    const debt = await prisma.debt.findUnique({ where: { id } });
    if (!debt) throw Object.assign(new Error("Debt not found"), { status: 404 });
    if (debt.userId !== userId)
        throw Object.assign(new Error("Forbidden access"), { status: 403 });

    return prisma.debt.delete({ where: { id } });
};

exports.pay = async (id, userId, { walletId, amount }) => {
    return prisma.$transaction(async (tx) => {
        // 1. Get Debt & Wallet
        const debt = await tx.debt.findUnique({ where: { id } });
        if (!debt) throw Object.assign(new Error("Debt not found"), { status: 404 });
        if (debt.userId !== userId)
            throw Object.assign(new Error("Forbidden access"), { status: 403 });

        if (debt.isPaid) {
            throw Object.assign(new Error("Debt is already fully paid"), { status: 400 });
        }

        if (amount > debt.remaining) {
            throw Object.assign(new Error(`Amount exceeds remaining debt (${debt.remaining})`), { status: 400 });
        }

        const wallet = await tx.wallet.findUnique({ where: { id: walletId } });
        if (!wallet)
            throw Object.assign(new Error("Wallet not found"), { status: 404 });
        if (wallet.userId !== userId)
            throw Object.assign(new Error("Forbidden access"), { status: 403 });

        // 2. Handle Payment Logic based on Type
        if (debt.type === "PAYABLE") {
            // We are paying our debt -> Expense
            if (wallet.balance < amount) {
                throw Object.assign(new Error("Insufficient wallet balance"), { status: 400 });
            }

            await tx.transaction.create({
                data: {
                    userId,
                    walletId,
                    type: "EXPENSE",
                    amount,
                    description: `Debt Payment to ${debt.personName}`,
                    date: new Date(),
                }
            });

            await tx.wallet.update({
                where: { id: walletId },
                data: { balance: wallet.balance - amount }
            });

        } else {
            // RECEIVABLE: Someone pays us -> Income
            await tx.transaction.create({
                data: {
                    userId,
                    walletId,
                    type: "INCOME",
                    amount,
                    description: `Debt Repayment from ${debt.personName}`,
                    date: new Date(),
                }
            });

            await tx.wallet.update({
                where: { id: walletId },
                data: { balance: wallet.balance + amount }
            });
        }

        // 3. Update Debt
        const newRemaining = debt.remaining - amount;
        const isPaid = newRemaining <= 0;

        return tx.debt.update({
            where: { id },
            data: {
                remaining: newRemaining,
                isPaid
            }
        });
    });
};
