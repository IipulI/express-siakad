import { Router } from "express";
// import { validateCreatePeriodeAkademik } from "../../validators/periode-akademik.validators.js";
import * as RuanganController from "../../controllers/akademik/ruangan.controller.js";
const router = new Router();

router.get("/", RuanganController.findAll);

export default router;
