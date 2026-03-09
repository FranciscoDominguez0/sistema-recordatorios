import authService from "./auth.service.js";
import activityLogsService from "../activity_logs/activityLogs.service.js";

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

      try {
        await activityLogsService.logActivity({
          user_id: result?.user?.id ?? null,
          action: "LOGIN",
          entity_type: "auth",
          entity_id: result?.user?.id ?? null,
          description: "Usuario inició sesión",
          ip_address: req.ip
        });
      } catch (error) {
        console.error("Activity log error:", error.message);
      }

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
