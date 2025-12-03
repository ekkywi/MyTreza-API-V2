const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const walletRoutes = require('./wallet.routes');
const categoryRoutes = require('./category.routes');
const transactionRoutes = require('./transaction.routes');
const transferRoutes = require('./transfer.routes');
const dashboardRoutes = require('./dashboard.routes');

router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/wallet', walletRoutes);
router.use('/category', categoryRoutes);
router.use('/transaction', transactionRoutes);
router.use('/transfer', transferRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;
