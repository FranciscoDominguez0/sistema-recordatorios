import { Router } from "express";
import { verifyToken } from "../../middleware/auth.middleware.js";
import clientsController from "./clients.controller.js";

const router = Router();

router.post("/", verifyToken, (req, res) => clientsController.create(req, res));
router.get("/", verifyToken, (req, res) => clientsController.getAll(req, res));
router.get("/:id/overview", verifyToken, (req, res) => clientsController.overview(req, res));
router.get("/:id", verifyToken, (req, res) => clientsController.getById(req, res));
router.put("/:id", verifyToken, (req, res) => clientsController.update(req, res));
router.delete("/:id", verifyToken, (req, res) => clientsController.delete(req, res));

export default router;
