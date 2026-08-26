import { Router } from "express";
import * as KonsentrasiController from "../../controllers/akademik/konsentrasi.controller.js";
import { validateCreateKonsentrasi } from "../../validators/konsentrasi.validator.js";
const router = new Router();

router.get("/", KonsentrasiController.findAll);
router.post("/", validateCreateKonsentrasi, KonsentrasiController.create);
router.put("/:id", KonsentrasiController.updateKonsentrasi);
router.delete("/:id", KonsentrasiController.deleteKonsentrasi);

export default router;
