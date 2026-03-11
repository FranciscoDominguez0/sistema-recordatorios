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
      SELECT id, name, email, password_hash, role, avatar_url
      FROM users
      WHERE email = ?
      LIMIT 1
    `;

    const [rows] = await pool.query(sql, [email]);
    return rows[0] ?? null;
  }
}

export default new AuthRepository();
