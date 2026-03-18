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

  async cleanupOlderThanDays(days) {
    const cutoffExpr = "DATE_SUB(NOW(), INTERVAL ? DAY)";

    // Compatibilidad: algunos esquemas antiguos no tienen columnas extra.
    const [colsSentAt] = await pool.query("SHOW COLUMNS FROM email_logs LIKE 'sent_at'");
    const [colsLastAttempt] = await pool.query("SHOW COLUMNS FROM email_logs LIKE 'last_attempt_at'");
    const [colsCreatedAt] = await pool.query("SHOW COLUMNS FROM email_logs LIKE 'created_at'");
    const [colsUpdatedAt] = await pool.query("SHOW COLUMNS FROM email_logs LIKE 'updated_at'");

    const hasSentAt = (colsSentAt?.length ?? 0) > 0;
    const hasLastAttempt = (colsLastAttempt?.length ?? 0) > 0;
    const hasCreatedAt = (colsCreatedAt?.length ?? 0) > 0;
    const hasUpdatedAt = (colsUpdatedAt?.length ?? 0) > 0;

    const dateCols = [
      hasSentAt ? "sent_at" : null,
      hasLastAttempt ? "last_attempt_at" : null,
      hasCreatedAt ? "created_at" : null,
      hasUpdatedAt ? "updated_at" : null
    ].filter(Boolean);

    if (dateCols.length === 0) {
      return {
        deleted: 0,
        candidates: 0,
        cutoff_days: days,
        used_columns: []
      };
    }

    const ageExpr = `COALESCE(${dateCols.join(", ")})`;

    const [[{ total }]] = await pool.query("SELECT COUNT(*) AS total FROM email_logs");
    const [[{ candidates }]] = await pool.query(
      `SELECT COUNT(*) AS candidates FROM email_logs WHERE ${ageExpr} IS NOT NULL AND ${ageExpr} >= ${cutoffExpr}`,
      [days]
    );
    const [[range]] = await pool.query(
      `SELECT MIN(${ageExpr}) AS oldest, MAX(${ageExpr}) AS newest FROM email_logs WHERE ${ageExpr} IS NOT NULL`
    );

    const [result] = await pool.query(
      `DELETE FROM email_logs WHERE ${ageExpr} IS NOT NULL AND ${ageExpr} >= ${cutoffExpr}`,
      [days]
    );

    return {
      deleted: result.affectedRows ?? 0,
      candidates,
      total,
      oldest: range?.oldest ?? null,
      newest: range?.newest ?? null,
      cutoff_days: days,
      used_columns: dateCols
    };
  }
}

export default new EmailLogsService();
