const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/category.controller");
const auth = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const {
  createCategorySchema,
  updateCategorySchema,
} = require("../../validators/category.validator");

router.post(
  "/",
  auth,
  validate(createCategorySchema),
  categoryController.create
);
router.get("/", auth, categoryController.list);
router.put(
  "/:id",
  auth,
  validate(updateCategorySchema),
  categoryController.update
);
router.delete("/:id", auth, categoryController.remove);

module.exports = router;
