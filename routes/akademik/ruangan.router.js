import { Router } from "express";
// import { validateCreatePeriodeAkademik } from "../../validators/periode-akademik.validators.js";
import * as RuanganController from "../../controllers/akademik/ruangan.controller.js";
import { validateCreateRuangan } from "../../validators/ruangan.validator.js";
const router = new Router();

router.get("/", RuanganController.findAll);
router.post("/", validateCreateRuangan, RuanganController.create);
router.put("/:id", RuanganController.updateRuangan);
router.delete("/:id", RuanganController.deleteRuangan);

export default router;
