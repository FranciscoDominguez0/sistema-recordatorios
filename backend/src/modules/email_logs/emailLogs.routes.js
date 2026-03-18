import { Router } from "express";
import { verifyToken } from "../../middlewares/auth.middleware.js";
import emailLogsController from "./emailLogs.controller.js";

const router = Router();

router.get("/", verifyToken, (req, res) => emailLogsController.getLogs(req, res));
router.get("/summary", verifyToken, (req, res) => emailLogsController.getSummary(req, res));
router.post("/cleanup", verifyToken, (req, res) => emailLogsController.cleanup(req, res));

export default router;
