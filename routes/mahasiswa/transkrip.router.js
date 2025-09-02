import { Router } from "express";
// import { validateCreatePeriodeAkademik } from "../../validators/periode-akademik.validators.js";
import * as TranskripController from "../../controllers/mahasiswa/transkrip.controller.js";
const router = new Router();

router.get("/", TranskripController.getTranskrip);

export default router;
