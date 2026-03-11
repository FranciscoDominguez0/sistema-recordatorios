import { Router } from "express";
import { verifyToken } from "../../middleware/auth.middleware.js";
import dashboardController from "./dashboard.controller.js";

const router = Router();

router.get("/stats", verifyToken, (req, res) => dashboardController.getStats(req, res));
router.get("/all",   verifyToken, (req, res) => dashboardController.getAll(req, res));

export default router;
