import { Router } from "express";
import * as KelompokMataKuliahController from "../../controllers/akademik/kelompok-mata-kuliah.controller.js";
import { validateCreateKelompokMataKuliah } from "../../validators/kelompok-mata-kuliah.validator.js";
const router = new Router();

router.get("/", KelompokMataKuliahController.findAll);
router.post("/", validateCreateKelompokMataKuliah, KelompokMataKuliahController.create);
router.put("/:id", KelompokMataKuliahController.updateJenjang);
router.delete("/:id", KelompokMataKuliahController.deleteJenjang);

export default router;
