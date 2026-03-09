import pool from "../../config/database.js";

class DashboardService {
  async getStats() {
    const [clientsRows] = await pool.query(
      "SELECT COUNT(*) AS total_clients FROM clients"
    );
    const [servicesRows] = await pool.query(
      "SELECT COUNT(*) AS total_services FROM services"
    );
    const [expiringRows] = await pool.query(
      "SELECT COUNT(*) AS services_expiring_soon FROM services WHERE expiration_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)"
    );
    const [pendingTasksRows] = await pool.query(
      "SELECT COUNT(*) AS pending_tasks FROM internal_tasks WHERE status = 'pending'"
    );
    const [emailsSentRows] = await pool.query(
      "SELECT COUNT(*) AS emails_sent_today FROM email_logs WHERE DATE(sent_at) = CURDATE() AND status = 'sent'"
    );

    return {
      total_clients: clientsRows[0]?.total_clients ?? 0,
      total_services: servicesRows[0]?.total_services ?? 0,
      services_expiring_soon: expiringRows[0]?.services_expiring_soon ?? 0,
      pending_tasks: pendingTasksRows[0]?.pending_tasks ?? 0,
      emails_sent_today: emailsSentRows[0]?.emails_sent_today ?? 0
    };
  }
}

export default new DashboardService();
