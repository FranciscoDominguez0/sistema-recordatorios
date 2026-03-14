import { Router } from "express";

import authRoutes from "../modules/auth/auth.routes.js";
import clientsRoutes from "../modules/clients/clients.routes.js";
import servicesRoutes from "../modules/services/services.routes.js";
import tasksRoutes from "../modules/tasks/tasks.routes.js";
import remindersRoutes from "../modules/reminders/reminder.routes.js";
import dashboardRoutes from "../modules/dashboard/dashboard.routes.js";
import emailSettingsRoutes from "../modules/email_settings/email_settings.routes.js";
import emailTemplatesRoutes from "../modules/email_templates/email_templates.routes.js";
import emailLayoutRoutes from "../modules/email_layout/email_layout.routes.js";
import activityLogsRoutes from "../modules/activity_logs/activityLogs.routes.js";
import usersRoutes from "../modules/users/users.routes.js";
import notificationsRoutes from "../modules/notifications/notifications.routes.js";
import companyRoutes from "../modules/company/company.routes.js";
import emailLogsRoutes from "../modules/email_logs/emailLogs.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/clients", clientsRoutes);
router.use("/services", servicesRoutes);
router.use("/tasks", tasksRoutes);
router.use("/reminders", remindersRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/email-settings", emailSettingsRoutes);
router.use("/email-templates", emailTemplatesRoutes);
router.use("/email-layout", emailLayoutRoutes);
router.use("/activity-logs", activityLogsRoutes);
router.use("/users", usersRoutes);
router.use("/notifications", notificationsRoutes);
router.use("/company", companyRoutes);
router.use("/email-logs", emailLogsRoutes);

export default router;
