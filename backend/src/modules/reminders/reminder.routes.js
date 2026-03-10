import { Router } from "express";
import { verifyToken } from "../../middleware/auth.middleware.js";
import reminderService from "./reminder.service.js";

const router = Router();

/**
 * POST /reminders/run
 * Dispara manualmente el proceso completo de recordatorios (mismo que el cron).
 * Requiere autenticación.
 */
router.post("/run", verifyToken, async (req, res) => {
  try {
    console.log(`[MANUAL] ${new Date().toLocaleString("es-PA")} — Disparado por usuario #${req.user?.id}`);
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

export default router;
