import { Router } from "express";
import { verifyToken } from "../../middlewares/auth.middleware.js";
import servicesController from "./services.controller.js";

const router = Router();

router.post("/", verifyToken, (req, res) => servicesController.create(req, res));
router.get("/", verifyToken, (req, res) => servicesController.getAll(req, res));
router.get("/client/:clientId", verifyToken, (req, res) =>
  servicesController.getByClient(req, res)
);
router.get("/:id", verifyToken, (req, res) => servicesController.getById(req, res));
router.put("/:id", verifyToken, (req, res) => servicesController.update(req, res));
router.post("/:id/renew", verifyToken, (req, res) => servicesController.renew(req, res));
router.delete("/:id", verifyToken, (req, res) => servicesController.delete(req, res));

export default router;
