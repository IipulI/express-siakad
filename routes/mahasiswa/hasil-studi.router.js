import { Router } from "express";
// import { validateCreatePeriodeAkademik } from "../../validators/periode-akademik.validators.js";
import * as HasilStudiController from "../../controllers/mahasiswa/hasil-studi.controller.js";
const router = new Router();

router.get("/", HasilStudiController.getHasilStudi);

export default router;
