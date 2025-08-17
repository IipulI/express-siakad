import { Router } from "express";
// import { validateCreatePeriodeAkademik } from "../../validators/periode-akademik.validators.js";
import * as PenghasilanPekerjaan from "../../controllers/akademik/penghasilan-pekerjaan.controller.js";
import { validateCreatePenghasilanPekerjaan } from "../../validators/penghasilan-pekerjaan.validator.js";
const router = new Router();

router.get("/", PenghasilanPekerjaan.findAll);
router.post(
  "/",
  validateCreatePenghasilanPekerjaan,
  PenghasilanPekerjaan.create
);
router.put("/:id", PenghasilanPekerjaan.updatePenghasilanPekerjaan);
router.delete("/:id", PenghasilanPekerjaan.deletePenghasilanPekerjaan);

export default router;
