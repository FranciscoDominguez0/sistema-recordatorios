import { Router } from "express";
import { verifyToken } from "../../middlewares/auth.middleware.js";
import activityLogsController from "./activityLogs.controller.js";

const router = Router();

router.get("/",             verifyToken, (req, res) => activityLogsController.getLogs(req, res));
router.get("/dashboard",    verifyToken, (req, res) => activityLogsController.dashboard(req, res));
router.get("/chart",        verifyToken, (req, res) => activityLogsController.chart(req, res));
router.get("/action-types", verifyToken, (req, res) => activityLogsController.getActionTypes(req, res));
router.post("/cleanup",     verifyToken, (req, res) => activityLogsController.cleanup(req, res));

export default router;
