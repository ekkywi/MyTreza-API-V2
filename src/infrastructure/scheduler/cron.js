const cron = require("node-cron");
const prisma = require("../prismaClient");
const notificationService = require("../../services/notification.service");

const processRecurringTransactions = async () => {
  console.log("⏳ Running Recurring Transaction Job...");
  const now = new Date();

  try {
    // 1. Find due transactions
    const dueTransactions = await prisma.recurringTransaction.findMany({
      where: {
        isActive: true,
        nextRun: {
          lte: now,
        },
      },
    });

    console.log(`Found ${dueTransactions.length} due recurring transactions.`);

    for (const rule of dueTransactions) {
      await prisma.$transaction(async (tx) => {
        // 2. Create Real Transaction
        await tx.transaction.create({
          data: {
            userId: rule.userId,
            walletId: rule.walletId,
            categoryId: rule.categoryId,
            type: rule.type,
            amount: rule.amount,
            description: rule.description || "Recurring Transaction",
            date: now,
          },
        });

        // 3. Update Wallet Balance
        const wallet = await tx.wallet.findUnique({
          where: { id: rule.walletId },
        });

        if (wallet) {
          const newBalance =
            rule.type === "INCOME"
              ? wallet.balance + rule.amount
              : wallet.balance - rule.amount;

          await tx.wallet.update({
            where: { id: rule.walletId },
            data: { balance: newBalance },
          });
        }

        // 4. Calculate Next Run
        const nextRun = new Date(rule.nextRun);
        if (rule.frequency === "DAILY") {
          nextRun.setDate(nextRun.getDate() + 1);
        } else if (rule.frequency === "WEEKLY") {
          nextRun.setDate(nextRun.getDate() + 7);
        } else if (rule.frequency === "MONTHLY") {
          nextRun.setMonth(nextRun.getMonth() + 1);
        } else if (rule.frequency === "YEARLY") {
          nextRun.setFullYear(nextRun.getFullYear() + 1);
        }

        // 5. Update Rule
        await tx.recurringTransaction.update({
          where: { id: rule.id },
          data: { nextRun },
        });
      });
    }

    console.log("✔ Recurring Transaction Job Completed.");
  } catch (err) {
    console.error("❌ Recurring Transaction Job Failed:", err);
  }
};

const processBillReminders = async () => {
  console.log("⏳ Running Bill Reminder Job...");
  const today = new Date();
  const threeDaysLater = new Date();
  threeDaysLater.setDate(today.getDate() + 3);

  // Set time range for "3 days from now" (start to end of that day)
  const startOfDay = new Date(threeDaysLater);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(threeDaysLater);
  endOfDay.setHours(23, 59, 59, 999);

  try {
    // 1. Check Recurring Transactions (Expenses)
    const upcomingRecurring = await prisma.recurringTransaction.findMany({
      where: {
        isActive: true,
        type: "EXPENSE",
        nextRun: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    for (const rule of upcomingRecurring) {
      await notificationService.create(rule.userId, {
        title: "Upcoming Bill Reminder 📅",
        message: `Reminder: ${rule.description || "Recurring Expense"} of ${rule.amount} is due on ${rule.nextRun.toDateString()}.`,
        type: "INFO",
      });
    }

    // 2. Check Debts (Payable)
    const upcomingDebts = await prisma.debt.findMany({
      where: {
        type: "PAYABLE",
        isPaid: false,
        dueDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    for (const debt of upcomingDebts) {
      await notificationService.create(debt.userId, {
        title: "Debt Due Soon 💸",
        message: `Reminder: Debt to ${debt.personName} of ${debt.remaining} is due on ${debt.dueDate.toDateString()}.`,
        type: "WARNING",
      });
    }

    console.log(`✔ Bill Reminder Job Completed. Sent ${upcomingRecurring.length + upcomingDebts.length} reminders.`);
  } catch (err) {
    console.error("❌ Bill Reminder Job Failed:", err);
  }
};

// Run every day at 00:00
const initCron = () => {
  // Recurring Transactions
  cron.schedule("0 0 * * *", processRecurringTransactions);

  // Bill Reminders (Run at 08:00 AM)
  cron.schedule("0 8 * * *", processBillReminders);

  console.log("⏰ Cron Jobs initialized: Recurring (00:00) & Reminders (08:00)");
};

module.exports = initCron;
