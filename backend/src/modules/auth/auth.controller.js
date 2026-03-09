import authService from "./auth.service.js";

/**
 * Auth Controller
 */
class AuthController {
  /**
   * POST /auth/login
   */
  async login(req, res) {
    try {
      const { email, password } = req.body ?? {};
      const result = await authService.login({ email, password });
      return res.json(result);
    } catch (error) {
      if (error?.statusCode === 401) {
        return res.status(401).json({ message: "Credenciales incorrectas" });
      }

      return res.status(500).json({ message: error.message });
    }
  }
}

export default new AuthController();
