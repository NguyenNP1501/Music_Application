const router = require("express").Router();
const { requireAuth, requireAdmin } = require("../middleware/auth");
const userController = require("../controllers/userController");

router.patch("/me", requireAuth, userController.updateProfile);
router.get("/admin/users", requireAuth, requireAdmin, userController.getUsers);
router.patch(
  "/admin/users/:id/role",
  requireAuth,
  requireAdmin,
  userController.updateUserRole,
);
router.delete(
  "/admin/users/:id",
  requireAuth,
  requireAdmin,
  userController.deleteUser,
);

module.exports = router;
