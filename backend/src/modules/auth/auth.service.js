import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import authRepository from "./auth.repository.js";

class AuthService {
  /**
   * Intenta autenticar un usuario por email y password.
   * Devuelve { token, user } si las credenciales son correctas.
   */
  async login({ email, password }) {
    if (!email || !password) {
      const error = new Error("Credenciales incorrectas");
      error.statusCode = 401;
      throw error;
    }

    const user = await authRepository.findUserByEmail(email);
    if (!user) {
      const error = new Error("Credenciales incorrectas");
      error.statusCode = 401;
      throw error;
    }

    const isActive = user?.is_active === undefined ? true : Boolean(user.is_active);
    if (!isActive) {
      const error = new Error("Usuario deshabilitado");
      error.statusCode = 403;
      throw error;
    }

    const maxAttempts = Number(process.env.MAX_LOGIN_ATTEMPTS) > 0
      ? Number(process.env.MAX_LOGIN_ATTEMPTS)
      : 3;

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      try {
        const updated = await authRepository.incrementFailedLoginAttempt(user.id);
        const attempts = Number(updated?.failed_login_attempts ?? NaN);
        if (Number.isFinite(attempts) && attempts >= maxAttempts) {
          await authRepository.deactivateUser(user.id);
        }
      } catch {
        // ignore
      }
      const error = new Error("Credenciales incorrectas");
      error.statusCode = 401;
      throw error;
    }

    try {
      await authRepository.resetFailedLoginAttempts(user.id);
    } catch {
      // ignore
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      const error = new Error("JWT_SECRET no configurado");
      error.statusCode = 500;
      throw error;
    }

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    const expiresIn = (process.env.JWT_EXPIRES_IN ?? "").trim() || "24h";
    const token = jwt.sign(payload, secret, { expiresIn });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url || null
      }
    };
  }
}

export default new AuthService();
