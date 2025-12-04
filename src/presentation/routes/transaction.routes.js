const express = require("express");
const router = express.Router();
const transactionController = require("../controllers/transaction.controller");
const auth = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const {
  createTransactionSchema,
  updateTransactionSchema,
} = require("../../validators/transaction.validator");
const multerLocal = require("../../infrastructure/upload/multerLocal");
const {
  handleImageUpload,
} = require("../../infrastructure/upload/localUploader");
const {
  searchTransactionSchema,
} = require("../../validators/transaction.validator");

router.get(
  "/search",
  auth,
  validate(searchTransactionSchema),
  transactionController.search
);

router.post(
  "/",
  auth,
  validate(createTransactionSchema),
  transactionController.create
);

router.get("/", auth, transactionController.list);

router.get("/:id", auth, transactionController.detail);

router.put(
  "/:id",
  auth,
  validate(updateTransactionSchema),
  transactionController.update
);

router.delete("/:id", auth, transactionController.remove);

router.post(
  "/:id/receipt",
  auth,
  multerLocal.single("receipt"),
  handleImageUpload("receipt"),
  transactionController.uploadReceipt
);

module.exports = router;
