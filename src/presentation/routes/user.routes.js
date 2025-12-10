const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const auth = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const {
  updateProfileSchema,
  changePasswordSchema,
} = require("../../validators/user.validator");
const multerLocal = require("../../infrastructure/upload/multerLocal");
const {
  handleImageUpload,
} = require("../../infrastructure/upload/localUploader");

router.get("/me", auth, userController.getProfile);
router.get("/profile", auth, userController.getProfile);

router.put(
  "/profile",
  auth,
  validate(updateProfileSchema),
  userController.updateProfile
);

router.put(
  "/change-password",
  auth,
  validate(changePasswordSchema),
  validate(changePasswordSchema),
  userController.changePassword
);

router.delete("/me", auth, userController.deleteAccount);

router.post(
  "/avatar",
  auth,
  multerLocal.single("avatar"),
  handleImageUpload("avatar"),
  userController.uploadAvatar
);

module.exports = router;
