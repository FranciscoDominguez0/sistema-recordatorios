import { Router } from "express";
import { verifyToken } from "../../middleware/auth.middleware.js";
import emailLayoutController from "./email_layout.controller.js";

const router = Router();

// GET  /api/email-layout   → obtener el layout actual
router.get("/", verifyToken, (req, res) => emailLayoutController.get(req, res));

// PUT  /api/email-layout   → actualizar el layout (solo admins)
router.put("/", verifyToken, (req, res) => emailLayoutController.update(req, res));

export default router;
