import pool from "../../config/database.js";

const ALLOWED_STATUSES = new Set(["activo", "vencido", "completado"]);

function normalizeStatus(value) {
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim().toLowerCase();
  if (!normalized) return null;
  return normalized;
}

class ServicesService {
  async create({
    client_id,
    service_name,
    description,
    start_date,
    expiration_date,
    reminder_days,
    status,
    auto_renew
  }) {
    const normalizedStatus = normalizeStatus(status) ?? "activo";
    if (!ALLOWED_STATUSES.has(normalizedStatus)) {
      throw new Error("Estado inválido");
    }

    const sql = `
      INSERT INTO services (
        client_id,
        service_name,
        description,
        start_date,
        expiration_date,
        reminder_days,
        status,
        auto_renew
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(sql, [
      client_id,
      service_name,
      description,
      start_date,
      expiration_date,
      reminder_days,
      normalizedStatus,
      auto_renew ? 1 : 0
    ]);

    return {
      id: result.insertId,
      client_id,
      service_name,
      description,
      start_date,
      expiration_date,
      reminder_days,
      status: normalizedStatus,
      auto_renew: auto_renew ? 1 : 0
    };
  }

  async getAllWithClient({ page = 1, limit = 10, search, status } = {}) {
    const safePage = Number.isFinite(Number(page)) && Number(page) > 0 ? Number(page) : 1;
    const safeLimit = Number.isFinite(Number(limit)) && Number(limit) > 0 ? Number(limit) : 10;
    const offset = (safePage - 1) * safeLimit;

    const hasSearch = Boolean(search && String(search).trim());
    const searchValue = `%${String(search).trim()}%`;

    const hasStatus = Boolean(status && String(status).trim());
    const safeStatus = String(status).trim();

    const whereSearchChunks = [];
    const whereSearchParams = [];

    if (hasSearch) {
      whereSearchChunks.push("(s.service_name LIKE ? OR c.name LIKE ?)");
      whereSearchParams.push(searchValue, searchValue);
    }

    const whereDataChunks = [...whereSearchChunks];
    const whereDataParams = [...whereSearchParams];

    if (hasStatus) {
      whereDataChunks.push("s.status = ?");
      whereDataParams.push(safeStatus);
    }

    const whereSql = whereDataChunks.length ? `WHERE ${whereDataChunks.join(" AND ")}` : "";
    const whereSqlSearchOnly = whereSearchChunks.length ? `WHERE ${whereSearchChunks.join(" AND ")}` : "";

    const dataSql = `
      SELECT s.*, c.name AS client_name
      FROM services s
      JOIN clients c ON s.client_id = c.id
      ${whereSql}
      ORDER BY s.created_at DESC, s.id DESC
      LIMIT ? OFFSET ?
    `;

    const countSql = `
      SELECT COUNT(*) AS total
      FROM services s
      JOIN clients c ON s.client_id = c.id
      ${whereSql}
    `;

    const summarySql = `
      SELECT
        SUM(CASE WHEN s.status = 'activo' THEN 1 ELSE 0 END) AS activos,
        SUM(CASE WHEN s.status = 'vencido' THEN 1 ELSE 0 END) AS vencidos,
        SUM(CASE WHEN s.status = 'completado' THEN 1 ELSE 0 END) AS completados
      FROM services s
      JOIN clients c ON s.client_id = c.id
      ${whereSqlSearchOnly}
    `;

    const [dataRows] = await pool.query(dataSql, [...whereDataParams, safeLimit, offset]);
    const [countRows] = await pool.query(countSql, whereDataParams);
    const [summaryRows] = await pool.query(summarySql, whereSearchParams);

    return {
      data: dataRows,
      total: countRows[0]?.total ?? 0,
      summary: {
        activos: Number(summaryRows[0]?.activos ?? 0),
        vencidos: Number(summaryRows[0]?.vencidos ?? 0),
        completados: Number(summaryRows[0]?.completados ?? 0)
      },
      page: safePage,
      limit: safeLimit
    };
  }

  async getByClientId(clientId) {
    const sql = `
      SELECT s.*, c.name AS client_name, c.email AS client_email
      FROM services s
      JOIN clients c ON s.client_id = c.id
      WHERE s.client_id = ?
      ORDER BY expiration_date ASC
    `;

    const [rows] = await pool.query(sql, [clientId]);
    return rows;
  }

  async getById(id) {
    const sql = `
      SELECT s.*, c.name AS client_name, c.email AS client_email
      FROM services s
      JOIN clients c ON s.client_id = c.id
      WHERE s.id = ?
      LIMIT 1
    `;

    const [rows] = await pool.query(sql, [id]);
    return rows[0] ?? null;
  }

  async update(id, {
    client_id,
    service_name,
    description,
    start_date,
    expiration_date,
    reminder_days,
    status,
    auto_renew
  }) {
    const normalizedStatus = normalizeStatus(status);
    if (normalizedStatus && !ALLOWED_STATUSES.has(normalizedStatus)) {
      throw new Error("Estado inválido");
    }

    let nextStatus = normalizedStatus;
    if (!nextStatus) {
      const existing = await this.getById(id);
      if (!existing) return false;
      nextStatus = normalizeStatus(existing.status) ?? "activo";
    }

    const sql = `
      UPDATE services
      SET client_id = ?,
          service_name = ?,
          description = ?,
          start_date = ?,
          expiration_date = ?,
          reminder_days = ?,
          status = ?,
          auto_renew = ?
      WHERE id = ?
    `;

    const [result] = await pool.query(sql, [
      client_id,
      service_name,
      description,
      start_date,
      expiration_date,
      reminder_days,
      nextStatus,
      auto_renew ? 1 : 0,
      id
    ]);

    return result.affectedRows > 0;
  }

  /** Renew a service: reset status to activo + set new expiration date */
  async renew(id, { new_expiration_date } = {}) {
    const existing = await this.getById(id);
    if (!existing) return null;

    // Calculate new expiration: provided date OR +1 year from old expiration
    let nextDate = new_expiration_date;
    if (!nextDate) {
      const old = new Date(existing.expiration_date);
      old.setFullYear(old.getFullYear() + 1);
      const yyyy = old.getFullYear();
      const mm   = String(old.getMonth() + 1).padStart(2, "0");
      const dd   = String(old.getDate()).padStart(2, "0");
      nextDate = `${yyyy}-${mm}-${dd}`;
    }

    await pool.query(
      `UPDATE services SET expiration_date = ?, status = 'activo' WHERE id = ?`,
      [nextDate, id]
    );

    // Clear reminder history so the service can receive new reminders
    await pool.query(`DELETE FROM reminder_history WHERE service_id = ?`, [id]);

    return this.getById(id);
  }

  async delete(id) {
    const sql = `DELETE FROM services WHERE id = ?`;
    const [result] = await pool.query(sql, [id]);
    return result.affectedRows > 0;
  }
}

export default new ServicesService();
