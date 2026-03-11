import express from "express";
import cors from "cors";
import pool from "./config/database.js";
import authRoutes from "./modules/auth/auth.routes.js";
import clientsRoutes from "./modules/clients/clients.routes.js";
import servicesRoutes from "./modules/services/services.routes.js";
import { startReminderJob } from "./modules/reminders/reminder.job.js";
import { startEmailRetryJob } from "./modules/email_logs/emailRetry.job.js";
import remindersRoutes from "./modules/reminders/reminder.routes.js";
import { seedDefaultTemplates } from "./config/seedTemplates.js";
import tasksRoutes from "./modules/tasks/tasks.routes.js";
import dashboardRoutes from "./modules/dashboard/dashboard.routes.js";
import emailSettingsRoutes from "./modules/email_settings/email_settings.routes.js";
import emailTemplatesRoutes from "./modules/email_templates/email_templates.routes.js";
import emailLayoutRoutes from "./modules/email_layout/email_layout.routes.js";
import activityLogsRoutes from "./modules/activity_logs/activityLogs.routes.js";
import usersRoutes from "./modules/users/users.routes.js";
import notificationsRoutes from "./modules/notifications/notifications.routes.js";
import companyRoutes from "./modules/company/company.routes.js";
import emailLogsRoutes from "./modules/email_logs/emailLogs.routes.js";

const app = express();

app.use(
  cors({
    origin: ["http://localhost:3001", "http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  })
);

app.options(/.*/, cors());

app.use(express.json({ limit: "5mb" }));

startReminderJob();
startEmailRetryJob();
seedDefaultTemplates();
app.use("/auth", authRoutes);
app.use("/clients", clientsRoutes);
app.use("/services", servicesRoutes);
app.use("/tasks", tasksRoutes);
app.use("/reminders", remindersRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/email-settings", emailSettingsRoutes);
app.use("/email-templates", emailTemplatesRoutes);
app.use("/email-layout", emailLayoutRoutes);
app.use("/activity-logs", activityLogsRoutes);
app.use("/users", usersRoutes);
app.use("/notifications", notificationsRoutes);
app.use("/company", companyRoutes);
app.use("/email-logs", emailLogsRoutes);
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
