const router = require("express").Router();
const { requireAuth } = require("../middleware/auth");
const roomController = require("../controllers/roomController");

router.get("/", requireAuth, roomController.getRooms);
router.post("/", requireAuth, roomController.createRoom);
router.post("/:id/join", requireAuth, roomController.joinRoom);
router.delete("/:id/leave", requireAuth, roomController.leaveRoom);
router.get("/:id/messages", requireAuth, roomController.getRoomMessages);
router.post("/:id/messages", requireAuth, roomController.sendRoomMessage);
router.delete("/:id", requireAuth, roomController.deleteRoom);

module.exports = router;
