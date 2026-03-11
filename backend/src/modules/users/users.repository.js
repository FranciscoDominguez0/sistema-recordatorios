import pool from "../../config/database.js";

let hasActiveColumnCache;
let hasNotifColumnCache;

async function hasIsActiveColumn() {
  if (typeof hasActiveColumnCache === "boolean") return hasActiveColumnCache;
  const [rows] = await pool.query("SHOW COLUMNS FROM users LIKE 'is_active'");
  hasActiveColumnCache = Array.isArray(rows) && rows.length > 0;
  return hasActiveColumnCache;
}

async function hasReceiveNotificationsColumn() {
  if (typeof hasNotifColumnCache === "boolean") return hasNotifColumnCache;
  const [rows] = await pool.query("SHOW COLUMNS FROM users LIKE 'receive_notifications'");
  hasNotifColumnCache = Array.isArray(rows) && rows.length > 0;
  return hasNotifColumnCache;
}

class UsersRepository {
  async findById(id) {
    const activeColumn = await hasIsActiveColumn();
    const notifColumn  = await hasReceiveNotificationsColumn();

    const cols = ["id", "name", "email", "role"];
    if (activeColumn) cols.push("is_active");
    if (notifColumn)  cols.push("receive_notifications");
    cols.push("created_at");

    const sql = `SELECT ${cols.join(", ")} FROM users WHERE id = ? LIMIT 1`;
    const [rows] = await pool.query(sql, [id]);
    const user = rows[0] ?? null;
    if (!user) return null;
    if (!activeColumn) user.is_active = true;
    if (!notifColumn)  user.receive_notifications = true;
    return user;
  }

  async findByEmail(email) {
    const sql = `
      SELECT id, name, email, password_hash, role
      FROM users
      WHERE email = ?
      LIMIT 1
    `;
    const [rows] = await pool.query(sql, [email]);
    return rows[0] ?? null;
  }

  async getAll({ page = 1, limit = 10, search } = {}) {
    const safePage = Number.isFinite(Number(page)) && Number(page) > 0 ? Number(page) : 1;
    const safeLimit = Number.isFinite(Number(limit)) && Number(limit) > 0 ? Number(limit) : 10;
    const offset = (safePage - 1) * safeLimit;

    const hasSearch = Boolean(search && String(search).trim());
    const searchValue = `%${String(search).trim()}%`;

    const activeColumn = await hasIsActiveColumn();
    const notifColumn  = await hasReceiveNotificationsColumn();

    const cols = ["id", "name", "email", "role"];
    if (activeColumn) cols.push("is_active");
    if (notifColumn)  cols.push("receive_notifications");
    cols.push("created_at");
    const selectSql = `SELECT ${cols.join(", ")}`;

    const whereSql = hasSearch ? "WHERE name LIKE ? OR email LIKE ?" : "";
    const whereParams = hasSearch ? [searchValue, searchValue] : [];

    const dataSql = `${selectSql} FROM users ${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    const countSql = `SELECT COUNT(*) AS total FROM users ${whereSql}`;
    const summarySql = activeColumn
      ? `SELECT SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS active, SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) AS admin, SUM(CASE WHEN role = 'staff' THEN 1 ELSE 0 END) AS staff FROM users ${whereSql}`
      : `SELECT COUNT(*) AS active, SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) AS admin, SUM(CASE WHEN role = 'staff' THEN 1 ELSE 0 END) AS staff FROM users ${whereSql}`;

    const [dataRows]    = await pool.query(dataSql, [...whereParams, safeLimit, offset]);
    const [countRows]   = await pool.query(countSql, whereParams);
    const [summaryRows] = await pool.query(summarySql, whereParams);

    const normalizedData = dataRows.map((u) => ({
      ...u,
      is_active: activeColumn ? Boolean(u.is_active) : true,
      receive_notifications: notifColumn ? Boolean(u.receive_notifications) : true
    }));

    return {
      data: normalizedData,
      total: countRows[0]?.total ?? 0,
      page: safePage,
      limit: safeLimit,
      summary: {
        active: Number(summaryRows[0]?.active ?? 0),
        admin:  Number(summaryRows[0]?.admin  ?? 0),
        staff:  Number(summaryRows[0]?.staff  ?? 0)
      }
    };
  }

  async create({ name, email, password_hash, role, is_active, receive_notifications }) {
    const activeColumn = await hasIsActiveColumn();
    const notifColumn  = await hasReceiveNotificationsColumn();

    const cols   = ["name", "email", "password_hash", "role"];
    const vals   = [name, email, password_hash, role];
    if (activeColumn) { cols.push("is_active");             vals.push(is_active ? 1 : 0); }
    if (notifColumn)  { cols.push("receive_notifications"); vals.push(receive_notifications !== false ? 1 : 0); }

    const sql = `INSERT INTO users (${cols.join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`;
    const [result] = await pool.query(sql, vals);

    return {
      id: result.insertId,
      name, email, role,
      is_active: Boolean(is_active),
      receive_notifications: notifColumn ? (receive_notifications !== false) : true
    };
  }

  async updateById(id, patch = {}) {
    const activeColumn = await hasIsActiveColumn();
    const notifColumn  = await hasReceiveNotificationsColumn();

    const entries = Object.entries(patch)
      .filter(([key]) => key !== "is_active" || activeColumn)
      .filter(([key]) => key !== "receive_notifications" || notifColumn)
      .filter(([, value]) => value !== undefined);

    if (entries.length === 0) return;

    const fields = entries.map(([key]) => `${key} = ?`).join(", ");
    const values = entries.map(([key, value]) => {
      if (key === "is_active" || key === "receive_notifications") return value ? 1 : 0;
      return value;
    });

    await pool.query(`UPDATE users SET ${fields} WHERE id = ? LIMIT 1`, [...values, id]);
  }

  async deleteById(id) {
    const sql = `
      DELETE FROM users
      WHERE id = ?
      LIMIT 1
    `;

    const [result] = await pool.query(sql, [id]);
    return Number(result?.affectedRows ?? 0) > 0;
  }
}

export default new UsersRepository();
