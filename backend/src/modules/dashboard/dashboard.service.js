import pool from "../../config/database.js";

class DashboardService {
  async getStats() {
    const [[clients]] = await pool.query("SELECT COUNT(*) AS total FROM clients");
    const [[services]] = await pool.query("SELECT COUNT(*) AS total FROM services");
    const [[activeServices]] = await pool.query("SELECT COUNT(*) AS total FROM services WHERE status = 'activo'");
    const [[expiringSoon]] = await pool.query(
      "SELECT COUNT(*) AS total FROM services WHERE expiration_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY) AND status = 'activo'"
    );
    const [[overdue]] = await pool.query(
      "SELECT COUNT(*) AS total FROM services WHERE expiration_date < CURDATE() AND status = 'activo'"
    );
    const [[pendingTasks]] = await pool.query(
      "SELECT COUNT(*) AS total FROM internal_tasks WHERE status = 'pending'"
    );
    const [[completedTasksToday]] = await pool.query(
      "SELECT COUNT(*) AS total FROM internal_tasks WHERE status = 'completed' AND DATE(created_at) = CURDATE()"
    );
    const [[actionsToday]] = await pool.query(
      "SELECT COUNT(*) AS total FROM activity_logs WHERE DATE(created_at) = CURDATE()"
    );

    return {
      total_clients: clients.total,
      total_services: services.total,
      active_services: activeServices.total,
      services_expiring_soon: expiringSoon.total,
      overdue_services: overdue.total,
      pending_tasks: pendingTasks.total,
      completed_tasks_today: completedTasksToday.total,
      actions_today: actionsToday.total
    };
  }

  async getServicesByStatus() {
    const [rows] = await pool.query(`
      SELECT status, COUNT(*) AS total FROM services GROUP BY status
    `);
    return rows;
  }

  async getClientsGrowth() {
    const [rows] = await pool.query(`
      SELECT
        DATE_FORMAT(DATE_SUB(DATE(created_at), INTERVAL WEEKDAY(created_at) DAY), '%Y-%m-%d') AS week,
        COUNT(*) AS new_clients
      FROM clients
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 8 WEEK)
      GROUP BY week
      ORDER BY week ASC
    `);
    return rows;
  }

  async getWeeklyActivity() {
    const [rows] = await pool.query(`
      SELECT
        DAYNAME(created_at) AS day_name,
        DAYOFWEEK(created_at) AS day_num,
        COUNT(*) AS actions
      FROM activity_logs
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY day_num, day_name
      ORDER BY day_num ASC
    `);
    return rows;
  }

  async getUpcomingServices(limit = 5) {
    const [rows] = await pool.query(`
      SELECT s.id, s.service_name AS name, s.expiration_date, s.reminder_days, c.name AS client_name
      FROM services s
      JOIN clients c ON s.client_id = c.id
      WHERE s.status = 'activo'
        AND s.expiration_date >= CURDATE()
        AND s.expiration_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
      ORDER BY s.expiration_date ASC
      LIMIT ?
    `, [limit]);
    return rows;
  }

  async getPendingTasks(limit = 5) {
    const [rows] = await pool.query(`
      SELECT id, title, due_date, status
      FROM internal_tasks
      WHERE status = 'pending'
      ORDER BY due_date ASC
      LIMIT ?
    `, [limit]);
    return rows;
  }

  async getTopClients(limit = 5) {
    const [rows] = await pool.query(`
      SELECT c.id, c.name, COUNT(s.id) AS total_services
      FROM clients c
      LEFT JOIN services s ON c.id = s.client_id
      GROUP BY c.id, c.name
      ORDER BY total_services DESC
      LIMIT ?
    `, [limit]);
    return rows;
  }
}

export default new DashboardService();
