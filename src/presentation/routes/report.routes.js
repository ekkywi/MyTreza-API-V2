const express = require("express");
const router = express.Router();
const reportController = require("../controllers/report.controller");
const auth = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const {
    searchTransactionSchema,
} = require("../../validators/transaction.validator");

// Re-use search schema because filters are identical
router.get(
    "/export",
    auth,
    validate(searchTransactionSchema),
    reportController.exportTransactions
);

module.exports = router;
