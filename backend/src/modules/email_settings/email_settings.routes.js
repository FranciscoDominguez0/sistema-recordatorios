import { Router } from "express";
import { verifyToken } from "../../middleware/auth.middleware.js";
import emailSettingsController from "./email_settings.controller.js";

const router = Router();

router.post("/", verifyToken, (req, res) => emailSettingsController.create(req, res));
router.get("/", verifyToken, (req, res) => emailSettingsController.get(req, res));
router.put("/:id", verifyToken, (req, res) => emailSettingsController.update(req, res));
router.post("/test", verifyToken, (req, res) => emailSettingsController.test(req, res));

export default router;
