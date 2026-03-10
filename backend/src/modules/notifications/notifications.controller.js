import notificationsService from "./notifications.service.js";

class NotificationsController {
  /** GET /notifications */
  async getNotifications(req, res) {
    try {
      const userId = req.user.id;
      const notifications = await notificationsService.getForUser(userId);
      const unread_count = await notificationsService.getUnreadCount(userId);
      return res.json({ notifications, unread_count });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  /** GET /notifications/unread-count */
  async getUnreadCount(req, res) {
    try {
      const count = await notificationsService.getUnreadCount(req.user.id);
      return res.json({ count });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  /** PUT /notifications/:id/read */
  async markRead(req, res) {
    try {
      const ok = await notificationsService.markRead(Number(req.params.id), req.user.id);
      if (!ok) return res.status(404).json({ message: "Notificación no encontrada" });
      return res.json({ message: "Marcada como leída" });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  /** PUT /notifications/read-all */
  async markAllRead(req, res) {
    try {
      const updated = await notificationsService.markAllRead(req.user.id);
      return res.json({ message: "Todas marcadas como leídas", updated });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  /** DELETE /notifications/:id */
  async deleteNotification(req, res) {
    try {
      const ok = await notificationsService.delete(Number(req.params.id), req.user.id);
      if (!ok) return res.status(404).json({ message: "Notificación no encontrada" });
      return res.json({ message: "Notificación eliminada" });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }
}

export default new NotificationsController();
