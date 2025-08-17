import { Router } from "express";
// import { validateCreatePeriodeAkademik } from "../../validators/periode-akademik.validators.js";
import * as PekerjaanController from "../../controllers/akademik/pekerjaan.controller.js";
import { validateCreatePekerjaan } from "../../validators/pekerjaan.validator.js";
const router = new Router();

router.get("/", PekerjaanController.findAll);
router.post("/", validateCreatePekerjaan, PekerjaanController.create);
router.put("/:id", PekerjaanController.updatePekerjaan);
router.delete("/:id", PekerjaanController.deletePekerjaan);

export default router;
