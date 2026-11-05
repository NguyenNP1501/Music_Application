const router = require("express").Router();
const { requireAuth } = require("../middleware/auth");
const authController = require("../controllers/authController");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/me", requireAuth, authController.getMe);
router.post("/password/change", requireAuth, authController.changePassword);
router.post("/password/forgot", authController.forgotPassword);
router.post("/password/reset", authController.resetPassword);

module.exports = router;
