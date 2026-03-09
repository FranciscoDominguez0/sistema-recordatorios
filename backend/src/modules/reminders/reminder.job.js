import cron from "node-cron";
import reminderService from "./reminder.service.js";

export function startReminderJob() {
  cron.schedule("0 8 * * *", async () => {
      console.log("Cron ejecutándose...");

    try {
      await reminderService.processDailyReminders();
    } catch (error) {
      console.error("Error ejecutando recordatorios:", error.message);
    }
  });
}
