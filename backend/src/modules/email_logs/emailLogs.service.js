import pool from "../../config/database.js";

class EmailLogsService {
  async getLogs({ page = 1, limit = 10, search = "", status = "" } = {}) {
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];

    if (search) {
      conditions.push("(el.email LIKE ? OR el.subject LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }
    if (status && status !== "all") {
      conditions.push("el.status = ?");
      params.push(status);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM email_logs el ${where}`,
      params
    );

    const [rows] = await pool.query(
      `SELECT
        el.id,
        el.email,
        el.subject,
        el.status,
        el.error_message,
        el.sent_at,
        c.name AS client_name
      FROM email_logs el
      LEFT JOIN clients c ON el.client_id = c.id
      ${where}
      ORDER BY el.sent_at DESC
      LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return {
      data: rows,
      pagination: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit)
      }
    };
  }

  async getSummary() {
    const [[sent]]   = await pool.query("SELECT COUNT(*) AS total FROM email_logs WHERE status = 'sent'");
    const [[failed]] = await pool.query("SELECT COUNT(*) AS total FROM email_logs WHERE status = 'failed'");
    const [[today]]  = await pool.query("SELECT COUNT(*) AS total FROM email_logs WHERE DATE(sent_at) = CURDATE()");
    const [[total]]  = await pool.query("SELECT COUNT(*) AS total FROM email_logs");
    return {
      total: total.total,
      sent: sent.total,
      failed: failed.total,
      today: today.total
    };
  }
}

export default new EmailLogsService();
