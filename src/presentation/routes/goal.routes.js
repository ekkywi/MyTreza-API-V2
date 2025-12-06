const express = require("express");
const router = express.Router();
const goalController = require("../controllers/goal.controller");
const auth = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const {
    createGoalSchema,
    updateGoalSchema,
    fundGoalSchema,
} = require("../../validators/goal.validator");

router.post("/", auth, validate(createGoalSchema), goalController.create);
router.get("/", auth, goalController.list);
router.get("/:id", auth, goalController.detail);
router.put("/:id", auth, validate(updateGoalSchema), goalController.update);
router.delete("/:id", auth, goalController.remove);

// Fund Management
router.post(
    "/:id/allocate",
    auth,
    validate(fundGoalSchema),
    goalController.allocate
);
router.post(
    "/:id/withdraw",
    auth,
    validate(fundGoalSchema),
    goalController.withdraw
);

module.exports = router;
