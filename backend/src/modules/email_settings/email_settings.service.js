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
      encryption,
      is_default: false
    };
  }

  async getByUserId(userId) {
    const sql = `
      SELECT id, user_id, smtp_host, smtp_port, smtp_email, smtp_password, encryption, is_default, created_at
      FROM email_settings
      WHERE user_id = ?
      ORDER BY is_default DESC, created_at DESC
      LIMIT 1
    `;

    const [rows] = await pool.query(sql, [userId]);
    return rows[0] ?? null;
  }

  async getAll() {
    const sql = `
      SELECT id, user_id, smtp_host, smtp_port, smtp_email, smtp_password, encryption, is_default, created_at
      FROM email_settings
      ORDER BY is_default DESC, created_at DESC
    `;
    const [rows] = await pool.query(sql);
    return rows;
  }

  async delete(id) {
    const [result] = await pool.query("DELETE FROM email_settings WHERE id = ?", [id]);
    return result.affectedRows > 0;
  }

  async getLatest() {
    const sql = `
      SELECT id, user_id, smtp_host, smtp_port, smtp_email, smtp_password, encryption, is_default, created_at
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

  async getDefault() {
    const sql = `
      SELECT id, user_id, smtp_host, smtp_port, smtp_email, smtp_password, encryption, is_default, created_at
      FROM email_settings
      WHERE is_default = TRUE
      LIMIT 1
    `;

    const [rows] = await pool.query(sql);
    return rows[0] ?? null;
  }

  async setDefault(id) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      await connection.query("UPDATE email_settings SET is_default = FALSE");
      const [result] = await connection.query(
        "UPDATE email_settings SET is_default = TRUE WHERE id = ?",
        [id]
      );

      await connection.commit();
      return result.affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

export default new EmailSettingsService();
