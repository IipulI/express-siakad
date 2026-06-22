import { Router } from "express";
// import { validateCreatePeriodeAkademik } from "../../validators/periode-akademik.validators.js";
import * as PengumumanController from "../../controllers/mahasiswa/pengumuman.controller.js";
import { validateCreatePengumuman } from "../../validators/pengumuman.validator.js";
const router = new Router();

router.get("/", PengumumanController.findAll);
router.get('/:id', PengumumanController.findOneById)

export default router;
