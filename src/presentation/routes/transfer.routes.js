const express = require("express");
const router = express.Router();
const transferController = require("../controllers/transfer.controller");
const auth = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const { createTransferSchema } = require("../../validators/transfer.validator");

router.post(
  "/",
  auth,
  validate(createTransferSchema),
  transferController.create
);
router.get("/", auth, transferController.list);

module.exports = router;
