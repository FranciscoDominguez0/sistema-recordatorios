import pool from "../../config/database.js";

/**
 * Repositorio de autenticación.
 * Encapsula consultas SQL relacionadas a login.
 */
class AuthRepository {
  /**
   * Busca un usuario por email.
   * Usa placeholders para evitar SQL injection.
   *
   * Se asume una tabla `users` con las columnas:
   * - id
   * - name
   * - email
   * - password_hash
   * - role
   */
  async findUserByEmail(email) {
    const sql = `
      SELECT id, name, email, password_hash, role, avatar_url, is_active, failed_login_attempts
      FROM users
      WHERE email = ?
      LIMIT 1
    `;

    const [rows] = await pool.query(sql, [email]);
    return rows[0] ?? null;
  }

  async incrementFailedLoginAttempt(userId) {
    const sql = `
      UPDATE users
      SET failed_login_attempts = COALESCE(failed_login_attempts, 0) + 1
      WHERE id = ?
    `;
    await pool.query(sql, [userId]);

    const [rows] = await pool.query(
      "SELECT failed_login_attempts, is_active FROM users WHERE id = ? LIMIT 1",
      [userId]
    );

    return rows[0] ?? null;
  }

  async resetFailedLoginAttempts(userId) {
    const sql = `
      UPDATE users
      SET failed_login_attempts = 0
      WHERE id = ?
    `;
    await pool.query(sql, [userId]);
  }

  async deactivateUser(userId) {
    const sql = `
      UPDATE users
      SET is_active = 0
      WHERE id = ?
    `;
    await pool.query(sql, [userId]);
  }
}

export default new AuthRepository();
