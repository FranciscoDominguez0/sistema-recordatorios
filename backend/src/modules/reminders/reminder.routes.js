import { Router } from "express";
import { verifyToken } from "../../middlewares/auth.middleware.js";
import reminderService from "./reminder.service.js";

const router = Router();

/**
 * POST /reminders/run
 * Dispara manualmente el proceso completo de recordatorios (mismo que el cron).
 * Requiere autenticación.
 */
router.post("/run", verifyToken, async (req, res) => {
  try {
    console.log(`[MANUAL] ${new Date().toLocaleString("es-PA", { timeZone: "America/Panama" })} — Disparado por usuario #${req.user?.id}`);
    const result = await reminderService.processDailyReminders();
    return res.json({
      message: "Proceso de recordatorios ejecutado manualmente",
      result
    });
  } catch (error) {
    console.error("[MANUAL] Error:", error.message);
    return res.status(500).json({ message: error.message });
  }
});

/**
 * GET /reminders/diagnostics
 * Devuelve info de zona horaria de Node.js y MySQL para debugging.
 * Requiere autenticación.
 */
router.get("/diagnostics", verifyToken, async (req, res) => {
  try {
    const diag = await reminderService.getTimezoneDiagnostics();
    return res.json(diag);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;
