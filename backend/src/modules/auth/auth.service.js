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

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      const error = new Error("Credenciales incorrectas");
      error.statusCode = 401;
      throw error;
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

    const token = jwt.sign(payload, secret, { expiresIn: "24h" });

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
