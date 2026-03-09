import express from "express";
import pool from "./config/database.js";
import authRoutes from "./modules/auth/auth.routes.js";
import clientsRoutes from "./modules/clients/clients.routes.js";
import servicesRoutes from "./modules/services/services.routes.js";
import { startReminderJob } from "./modules/reminders/reminder.job.js";
import tasksRoutes from "./modules/tasks/tasks.routes.js";
import dashboardRoutes from "./modules/dashboard/dashboard.routes.js";
import emailSettingsRoutes from "./modules/email_settings/email_settings.routes.js";
import emailTemplatesRoutes from "./modules/email_templates/email_templates.routes.js";
import activityLogsRoutes from "./modules/activity_logs/activityLogs.routes.js";

const app = express();

app.use(express.json());

startReminderJob();
app.use("/auth", authRoutes);
app.use("/clients", clientsRoutes);
app.use("/services", servicesRoutes);
app.use("/tasks", tasksRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/email-settings", emailSettingsRoutes);
app.use("/email-templates", emailTemplatesRoutes);
app.use("/activity-logs", activityLogsRoutes);
app.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT NOW() as time");

    res.json({
      message: "Servidor funcionando",
      database_time: rows[0].time
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
