const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notification.controller");
const auth = require("../middleware/auth.middleware");

router.get("/", auth, notificationController.list);
router.patch("/read-all", auth, notificationController.markAllAsRead);
router.patch("/:id/read", auth, notificationController.markAsRead);
router.delete("/:id", auth, notificationController.remove);

module.exports = router;
