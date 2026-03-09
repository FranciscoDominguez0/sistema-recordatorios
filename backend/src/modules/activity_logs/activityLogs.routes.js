import { Router } from "express";
import { verifyToken } from "../../middleware/auth.middleware.js";
import activityLogsController from "./activityLogs.controller.js";

const router = Router();

router.get("/", verifyToken, (req, res) => activityLogsController.getLogs(req, res));
router.get("/dashboard", verifyToken, (req, res) => activityLogsController.dashboard(req, res));

export default router;
