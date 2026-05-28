import cron from "node-cron";
import reminderService from "./reminder.service.js";

export function startReminderJob() {
  // Se ejecuta todos los días a las 8:00 AM hora Panamá
  cron.schedule("0 8 * * *", async () => {
    console.log(`\n[CRON] ${new Date().toLocaleString("es-PA", { timeZone: "America/Panama" })} — Ejecutando recordatorios diarios...`);
    try {
      const result = await reminderService.processDailyReminders();
      console.log("[CRON] Finalizado:", result);
    } catch (error) {
      console.error("[CRON] Error:", error.message);
    }
  }, {
    timezone: "America/Panama"
  });

  console.log("✅ Cron job de recordatorios iniciado (todos los días 8:00 AM hora Panamá).");
}
