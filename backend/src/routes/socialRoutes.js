const router = require("express").Router();
const { requireAuth } = require("../middleware/auth");
const socialController = require("../controllers/socialController");

router.post("/users/:id/follow", requireAuth, socialController.followUser);
router.delete("/users/:id/follow", requireAuth, socialController.unfollowUser);
router.get("/users/me/following", requireAuth, socialController.getFollowing);
router.get("/users/me/followers", requireAuth, socialController.getFollowers);
router.get("/notifications", requireAuth, socialController.getNotifications);
router.patch(
  "/notifications/:id/read",
  requireAuth,
  socialController.markNotificationAsRead,
);

module.exports = router;
