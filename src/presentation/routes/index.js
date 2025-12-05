const express = require("express");
const router = express.Router();

const authRoutes = require("./auth.routes");
const userRoutes = require("./user.routes");
const walletRoutes = require("./wallet.routes");
const categoryRoutes = require("./category.routes");
const transactionRoutes = require("./transaction.routes");
const transferRoutes = require("./transfer.routes");
const dashboardRoutes = require("./dashboard.routes");
const budgetRoutes = require("./budget.routes");

router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/wallets", walletRoutes);
router.use("/categories", categoryRoutes);
router.use("/transactions", transactionRoutes);
router.use("/transfer", transferRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/budget", budgetRoutes);

module.exports = router;
