import { Router } from "express";
import { verifyToken } from "../../middleware/auth.middleware.js";
import tasksController from "./tasks.controller.js";

const router = Router();

router.post("/", verifyToken, (req, res) => tasksController.create(req, res));
router.get("/", verifyToken, (req, res) => tasksController.getAll(req, res));
router.get("/pending", verifyToken, (req, res) => tasksController.getPending(req, res));
router.get("/:id", verifyToken, (req, res) => tasksController.getById(req, res));
router.put("/:id/complete", verifyToken, (req, res) => tasksController.complete(req, res));
router.put("/:id/pending", verifyToken, (req, res) => tasksController.pending(req, res));
router.delete("/:id", verifyToken, (req, res) => tasksController.delete(req, res));

export default router;
