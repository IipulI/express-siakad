import { Router } from "express";
// import { validateCreatePeriodeAkademik } from "../../validators/periode-akademik.validators.js";
import * as PengumumanController from "../../controllers/mahasiswa/pengumuman.controller.js";
import { validateCreatePengumuman } from "../../validators/pengumuman.validator.js";
const router = new Router();

router.get("/", PengumumanController.findAll);
router.post("/", validateCreatePengumuman, PengumumanController.create);
router.put("/:id", PengumumanController.updatePengumuman);
router.delete("/:id", PengumumanController.deletePengumuman);

export default router;
