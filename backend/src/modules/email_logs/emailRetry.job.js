import cron from "node-cron";
import emailLogsRetryService from "./emailRetry.service.js";

export function startEmailRetryJob() {
  // Se ejecuta cada minuto
  cron.schedule("*/1 * * * *", async () => {
    try {
      const result = await emailLogsRetryService.processDueRetries();
      if (result.processed > 0 || result.sent > 0 || result.failed > 0) {
        console.log("[EMAIL RETRY]", result);
      }
    } catch (error) {
      console.error("[EMAIL RETRY] Error:", error.message);
    }
  });

  console.log("✅ Cron job de reintento de correos iniciado (cada minuto).");
}
