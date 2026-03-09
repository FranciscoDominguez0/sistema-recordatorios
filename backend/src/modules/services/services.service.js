import pool from "../../config/database.js";

class ServicesService {
  async create({
    client_id,
    service_name,
    description,
    start_date,
    expiration_date,
    reminder_days
  }) {
    const sql = `
      INSERT INTO services (
        client_id,
        service_name,
        description,
        start_date,
        expiration_date,
        reminder_days
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(sql, [
      client_id,
      service_name,
      description,
      start_date,
      expiration_date,
      reminder_days
    ]);

    return {
      id: result.insertId,
      client_id,
      service_name,
      description,
      start_date,
      expiration_date,
      reminder_days
    };
  }

  async getAllWithClient() {
    const sql = `
      SELECT s.*, c.name, c.email
      FROM services s
      JOIN clients c ON s.client_id = c.id
      ORDER BY expiration_date ASC
    `;

    const [rows] = await pool.query(sql);
    return rows;
  }

  async getByClientId(clientId) {
    const sql = `
      SELECT s.*, c.name, c.email
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
      SELECT s.*, c.name, c.email
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
    reminder_days
  }) {
    const sql = `
      UPDATE services
      SET client_id = ?,
          service_name = ?,
          description = ?,
          start_date = ?,
          expiration_date = ?,
          reminder_days = ?
      WHERE id = ?
    `;

    const [result] = await pool.query(sql, [
      client_id,
      service_name,
      description,
      start_date,
      expiration_date,
      reminder_days,
      id
    ]);

    return result.affectedRows > 0;
  }

  async delete(id) {
    const sql = `DELETE FROM services WHERE id = ?`;
    const [result] = await pool.query(sql, [id]);
    return result.affectedRows > 0;
  }
}

export default new ServicesService();
