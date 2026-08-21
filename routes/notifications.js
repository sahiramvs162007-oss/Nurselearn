const express = require("express");
const router = express.Router();
const { isAuth } = require("../middleware/auth");
const notifCtrl = require("../controllers/notificationController");

router.use(isAuth);
router.get("/", notifCtrl.getNotifications);
router.post("/:id/leido", notifCtrl.markAsRead);
router.post("/marcar-todo", notifCtrl.markAllAsRead);

module.exports = router;
