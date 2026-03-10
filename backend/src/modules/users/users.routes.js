import { Router } from "express";
import { verifyToken } from "../../middleware/auth.middleware.js";
import usersController from "./users.controller.js";

const router = Router();

router.get("/", verifyToken, (req, res) => usersController.getAll(req, res));
router.post("/", verifyToken, (req, res) => usersController.create(req, res));
router.put("/:id", verifyToken, (req, res) => usersController.update(req, res));
router.delete("/:id", verifyToken, (req, res) => usersController.remove(req, res));

export default router;
