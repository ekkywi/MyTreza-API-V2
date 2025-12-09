const express = require("express");
const router = express.Router();
const walletController = require("../controllers/wallet.controller");
const auth = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const {
  createWalletSchema,
  updateWalletSchema,
} = require("../../validators/wallet.validator");

router.post("/", auth, validate(createWalletSchema), walletController.create);
router.get("/", auth, walletController.list);
router.get("/:id", auth, walletController.detail);
router.get("/:id/stats", auth, walletController.stats);
router.get("/:id/stats/daily", auth, walletController.dailyStats);
router.put("/:id", auth, validate(updateWalletSchema), walletController.update);
router.delete("/:id", auth, walletController.remove);

module.exports = router;
