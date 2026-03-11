import pool from "../../config/database.js";

class NotificationsService {
  /** Crear una notificación para un usuario (o broadcast a todos los admins si user_id es null) */
  async create({ user_id, client_id, service_id, task_id, type, title, message }) {
    const [result] = await pool.query(
      `INSERT INTO notifications (user_id, client_id, service_id, task_id, type, title, message)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [user_id ?? null, client_id ?? null, service_id ?? null, task_id ?? null, type, title, message ?? null]
    );
    return result.insertId;
  }

  /** Crear notificación para CADA admin */
  async broadcastToAdmins({ client_id, service_id, task_id, type, title, message }) {
    const [admins] = await pool.query("SELECT id FROM users WHERE role = 'admin'");
    for (const admin of admins) {
      await this.create({ user_id: admin.id, client_id, service_id, task_id, type, title, message });
    }
  }

  /** Listar notificaciones del usuario autenticado (más recientes primero) */
  async getForUser(userId, { limit = 30 } = {}) {
    const [rows] = await pool.query(
      `SELECT id, user_id, client_id, service_id, task_id, type, title, message, is_read, created_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ?`,
      [userId, limit]
    );
    return rows;
  }

  /** Contar no leídas del usuario */
  async getUnreadCount(userId) {
    const [[row]] = await pool.query(
      "SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = FALSE",
      [userId]
    );
    return Number(row?.count ?? 0);
  }

  /** Marcar una como leída */
  async markRead(id, userId) {
    const [result] = await pool.query(
      "UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?",
      [id, userId]
    );
    return result.affectedRows > 0;
  }

  /** Marcar todas como leídas */
  async markAllRead(userId) {
    const [result] = await pool.query(
      "UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE",
      [userId]
    );
    return result.affectedRows;
  }

  /** Eliminar una notificación */
  async delete(id, userId) {
    const [result] = await pool.query(
      "DELETE FROM notifications WHERE id = ? AND user_id = ?",
      [id, userId]
    );
    return result.affectedRows > 0;
  }

  /** Eliminar todas las notificaciones del usuario */
  async deleteAll(userId) {
    const [result] = await pool.query(
      "DELETE FROM notifications WHERE user_id = ?",
      [userId]
    );
    return result.affectedRows;
  }

  /** ¿Ya hay notificación de tarea hoy? (evitar duplicados del cron) */
  async hasTaskNotificationToday(taskId) {
    const [[row]] = await pool.query(
      `SELECT id FROM notifications
       WHERE task_id = ? AND type = 'task_due' AND DATE(created_at) = CURDATE()
       LIMIT 1`,
      [taskId]
    );
    return Boolean(row);
  }

  /** ¿Ya hay notificación de servicio hoy? (evitar duplicados del cron) */
  async hasServiceNotificationToday(serviceId) {
    const [[row]] = await pool.query(
      `SELECT id FROM notifications
       WHERE service_id = ? AND type = 'service_expiring' AND DATE(created_at) = CURDATE()
       LIMIT 1`,
      [serviceId]
    );
    return Boolean(row);
  }
}

export default new NotificationsService();
