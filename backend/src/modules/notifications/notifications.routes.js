import { Router } from "express";
import { verifyToken } from "../../middleware/auth.middleware.js";
import notificationsController from "./notifications.controller.js";

const router = Router();

// Todas las rutas requieren autenticación
router.use(verifyToken);

router.get("/",               notificationsController.getNotifications.bind(notificationsController));
router.get("/unread-count",   notificationsController.getUnreadCount.bind(notificationsController));
router.put("/read-all",       notificationsController.markAllRead.bind(notificationsController));
router.put("/:id/read",       notificationsController.markRead.bind(notificationsController));
router.delete("/",            notificationsController.clearAll.bind(notificationsController));
router.delete("/:id",         notificationsController.deleteNotification.bind(notificationsController));

export default router;
