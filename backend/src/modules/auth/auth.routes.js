import { Router } from "express";
import authController from "./auth.controller.js";

const router = Router();

router.post("/login", (req, res) => authController.login(req, res));

export default router;
