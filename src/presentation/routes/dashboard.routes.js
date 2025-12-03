const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboard.controller");
const auth = require("../middleware/auth.middleware");

router.get("/summary", auth, dashboardController.summary);

module.exports = router;
