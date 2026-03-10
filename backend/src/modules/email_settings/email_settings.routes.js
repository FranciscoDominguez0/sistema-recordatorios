import { Router } from "express";
import { verifyToken } from "../../middleware/auth.middleware.js";
import emailSettingsController from "./email_settings.controller.js";

const router = Router();

router.get("/all",         verifyToken, (req, res) => emailSettingsController.getAll(req, res));
router.post("/test",       verifyToken, (req, res) => emailSettingsController.test(req, res));
router.post("/",           verifyToken, (req, res) => emailSettingsController.create(req, res));
router.get("/",            verifyToken, (req, res) => emailSettingsController.get(req, res));
router.put("/:id/default", verifyToken, (req, res) => emailSettingsController.setDefault(req, res));
router.put("/:id",         verifyToken, (req, res) => emailSettingsController.update(req, res));
router.delete("/:id",      verifyToken, (req, res) => emailSettingsController.destroy(req, res));

export default router;
