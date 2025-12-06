const express = require("express");
const router = express.Router();
const recurringController = require("../controllers/recurring.controller");
const auth = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const {
    createRecurringSchema,
    updateRecurringSchema,
} = require("../../validators/recurring.validator");

router.post(
    "/",
    auth,
    validate(createRecurringSchema),
    recurringController.create
);
router.get("/", auth, recurringController.list);
router.put(
    "/:id",
    auth,
    validate(updateRecurringSchema),
    recurringController.update
);
router.delete("/:id", auth, recurringController.remove);

module.exports = router;
