import { Router } from "express";
// import { validateCreatePeriodeAkademik } from "../../validators/periode-akademik.validators.js";
import * as KrsMahasiswaController from "../../controllers/mahasiswa/krs-mahasiswa.controller.js";
const router = new Router();

router.get("/", KrsMahasiswaController.getKrsHistory);

export default router;
