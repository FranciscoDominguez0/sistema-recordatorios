import pool from "../../config/database.js";

class EmailSettingsService {
  async create(userId, { smtp_host, smtp_port, smtp_email, smtp_password, encryption }) {
    const sql = `
      INSERT INTO email_settings (
        user_id,
        smtp_host,
        smtp_port,
        smtp_email,
        smtp_password,
        encryption
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(sql, [
      userId,
      smtp_host,
      smtp_port,
      smtp_email,
      smtp_password,
      encryption
    ]);

    return {
      id: result.insertId,
      user_id: userId,
      smtp_host,
      smtp_port,
      smtp_email,
      smtp_password,
      encryption
    };
  }

  async getByUserId(userId) {
    const sql = `
      SELECT id, user_id, smtp_host, smtp_port, smtp_email, smtp_password, encryption, created_at
      FROM email_settings
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const [rows] = await pool.query(sql, [userId]);
    return rows[0] ?? null;
  }

  async getLatest() {
    const sql = `
      SELECT id, user_id, smtp_host, smtp_port, smtp_email, smtp_password, encryption, created_at
      FROM email_settings
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const [rows] = await pool.query(sql);
    return rows[0] ?? null;
  }

  async update(id, userId, { smtp_host, smtp_port, smtp_email, smtp_password, encryption }) {
    const sql = `
      UPDATE email_settings
      SET smtp_host = ?,
          smtp_port = ?,
          smtp_email = ?,
          smtp_password = ?,
          encryption = ?
      WHERE id = ? AND user_id = ?
    `;

    const [result] = await pool.query(sql, [
      smtp_host,
      smtp_port,
      smtp_email,
      smtp_password,
      encryption,
      id,
      userId
    ]);

    return result.affectedRows > 0;
  }
}

export default new EmailSettingsService();
