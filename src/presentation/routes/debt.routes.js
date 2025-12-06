const express = require("express");
const router = express.Router();
const debtController = require("../controllers/debt.controller");
const auth = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const {
    createDebtSchema,
    updateDebtSchema,
    payDebtSchema,
} = require("../../validators/debt.validator");

router.post("/", auth, validate(createDebtSchema), debtController.create);
router.get("/", auth, debtController.list);
router.get("/:id", auth, debtController.detail);
router.put("/:id", auth, validate(updateDebtSchema), debtController.update);
router.delete("/:id", auth, debtController.remove);

// Pay
router.post("/:id/pay", auth, validate(payDebtSchema), debtController.pay);

module.exports = router;
