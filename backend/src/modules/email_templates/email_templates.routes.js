import { Router } from "express";
import { verifyToken } from "../../middleware/auth.middleware.js";
import emailTemplatesController from "./email_templates.controller.js";

const router = Router();

router.post("/", verifyToken, (req, res) => emailTemplatesController.create(req, res));
router.get("/", verifyToken, (req, res) => emailTemplatesController.getAll(req, res));
router.get("/:name", verifyToken, (req, res) => emailTemplatesController.getByName(req, res));
router.put("/:id", verifyToken, (req, res) => emailTemplatesController.update(req, res));
router.delete("/:id", verifyToken, (req, res) => emailTemplatesController.delete(req, res));

export default router;
