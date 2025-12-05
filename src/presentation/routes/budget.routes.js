const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const controller = require("../controllers/budget.controller");
const {
  monthlySchema,
  categorySchema,
  usageSchema,
} = require("../../validators/budget.validator");

router.post("/monthly", auth, validate(monthlySchema), controller.setMonthly);
router.get("/monthly", auth, validate(usageSchema), controller.getMonthly);

router.post(
  "/category",
  auth,
  validate(categorySchema),
  controller.setCategory
);
router.get("/category", auth, validate(usageSchema), controller.getCategories);

router.get("/recommendations", auth, controller.getRecommendations);

router.get("/usage", auth, validate(usageSchema), controller.usage);

module.exports = router;
