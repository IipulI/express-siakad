import { Router } from "express";
import * as JenisMataKuliahController from "../../controllers/akademik/jenis-mata-kuliah.controller.js";
import { validateCreateJenisMataKuliah } from "../../validators/jenis-mata-kuliah.validator.js";
const router = new Router();

router.get("/", JenisMataKuliahController.findAll);
router.post("/", validateCreateJenisMataKuliah, JenisMataKuliahController.create);
router.put("/:id", JenisMataKuliahController.updateJenjang);
router.delete("/:id", JenisMataKuliahController.deleteJenjang);

export default router;
