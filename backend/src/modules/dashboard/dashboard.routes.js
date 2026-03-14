import { Router } from "express";
import { verifyToken } from "../../middlewares/auth.middleware.js";
import dashboardController from "./dashboard.controller.js";

const router = Router();

router.get("/summary", verifyToken, (req, res) => dashboardController.getSummary(req, res));
router.get("/all",   verifyToken, (req, res) => dashboardController.getAll(req, res));

export default router;
