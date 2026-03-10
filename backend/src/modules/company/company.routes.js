import { Router } from "express";
import { verifyToken } from "../../middleware/auth.middleware.js";
import companyController from "./company.controller.js";

const router = Router();

// Ruta pública — sin auth — para que los clientes de email puedan cargar el logo
router.get("/logo", companyController.getLogo.bind(companyController));

router.use(verifyToken);
router.get("/",  companyController.get.bind(companyController));
router.put("/",  companyController.save.bind(companyController));

export default router;
