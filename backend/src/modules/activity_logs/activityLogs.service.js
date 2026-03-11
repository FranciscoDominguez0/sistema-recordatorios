import pool from "../../config/database.js";

class ActivityLogsService {
  async logActivity({
    user_id,
    action,
    entity_type,
    entity_id,
    description,
    ip_address
  }) {
    const sql = `
      INSERT INTO activity_logs (user_id, action, entity_type, entity_id, description, ip_address)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(sql, [
      user_id ?? null,
      action,
      entity_type ?? null,
      entity_id ?? null,
      description ?? null,
      ip_address ?? null
    ]);

    return result.insertId;
  }

  async getLogs({
    page = 1,
    limit = 20,
    user_id,
    action,
    entity_type,
    date_from,
    date_to
  } = {}) {
    const safePage = Number.isFinite(Number(page)) && Number(page) > 0 ? Number(page) : 1;
    const safeLimit = Number.isFinite(Number(limit)) && Number(limit) > 0 ? Number(limit) : 20;
    const offset = (safePage - 1) * safeLimit;

    const conditions = [];
    const params = [];

    if (user_id) {
      conditions.push("al.user_id = ?");
      params.push(Number(user_id));
    }

    if (action) {
      conditions.push("al.action = ?");
      params.push(String(action));
    }

    if (entity_type) {
      conditions.push("al.entity_type = ?");
      params.push(String(entity_type));
    }

    if (date_from) {
      conditions.push("DATE(al.created_at) >= DATE(?)");
      params.push(String(date_from));
    }

    if (date_to) {
      conditions.push("DATE(al.created_at) <= DATE(?)");
      params.push(String(date_to));
    }

    const whereSql = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const dataSql = `
      SELECT
        al.id,
        al.user_id,
        u.name AS user,
        al.action,
        al.entity_type,
        al.entity_id,
        al.description,
        al.ip_address,
        al.created_at
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ${whereSql}
      ORDER BY al.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const countSql = `
      SELECT COUNT(*) AS total
      FROM activity_logs al
      ${whereSql}
    `;

    const [rows] = await pool.query(dataSql, [...params, safeLimit, offset]);
    const [countRows] = await pool.query(countSql, params);

    return {
      data: rows,
      total: countRows[0]?.total ?? 0,
      page: safePage,
      limit: safeLimit
    };
  }

  async getDashboardStats() {
    const [todayRows] = await pool.query(
      "SELECT COUNT(*) AS actions_today FROM activity_logs WHERE DATE(created_at) = CURDATE()"
    );

    const [weekRows] = await pool.query(
      "SELECT COUNT(*) AS actions_this_week FROM activity_logs WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)"
    );

    const [topUsersRows] = await pool.query(`
      SELECT u.id, u.name, COUNT(*) AS actions
      FROM activity_logs al
      JOIN users u ON al.user_id = u.id
      WHERE al.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY u.id, u.name
      ORDER BY actions DESC
      LIMIT 5
    `);

    return {
      actions_today: todayRows[0]?.actions_today ?? 0,
      actions_this_week: weekRows[0]?.actions_this_week ?? 0,
      top_users: topUsersRows
    };
  }
  async getActivityChart(days = 30) {
    const safeDays = Math.min(Math.max(Number(days) || 30, 7), 90);

    const [dailyRows] = await pool.query(`
      SELECT
        DATE(created_at) AS date,
        COUNT(*) AS total
      FROM activity_logs
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, [safeDays]);

    const [byActionRows] = await pool.query(`
      SELECT action, COUNT(*) AS total
      FROM activity_logs
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY action
      ORDER BY total DESC
      LIMIT 10
    `, [safeDays]);

    const [byEntityRows] = await pool.query(`
      SELECT entity_type, COUNT(*) AS total
      FROM activity_logs
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        AND entity_type IS NOT NULL
      GROUP BY entity_type
      ORDER BY total DESC
    `, [safeDays]);

    return { daily: dailyRows, by_action: byActionRows, by_entity: byEntityRows };
  }

  async getActionTypes() {
    const [rows] = await pool.query(
      "SELECT DISTINCT action FROM activity_logs ORDER BY action ASC"
    );
    return rows.map((r) => r.action);
  }
}

export default new ActivityLogsService();
