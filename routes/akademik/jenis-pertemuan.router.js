import { Router } from "express";
import * as JenisPertemuanController from "../../controllers/akademik/jenis-pertemuan.controller.js";
import { validateCreateJenisPertemuan } from "../../validators/jenis-pertemuan.validator.js";

const router = new Router();

router.get("/", JenisPertemuanController.findAll);
router.get("/:id", JenisPertemuanController.findOneById);
router.post("/", validateCreateJenisPertemuan, JenisPertemuanController.create);
router.put("/:id", JenisPertemuanController.update);
router.delete("/:id", JenisPertemuanController.destroy);

export default router;
