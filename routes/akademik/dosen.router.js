import { Router } from "express";
import * as DosenController from "../../controllers/akademik/dosen.controller.js";

const router = new Router();

router.get("/", DosenController.findAll);
router.post("/sync-simpeg", DosenController.syncSimpeg);
router.get("/:id", DosenController.findOneById);

export default router;
