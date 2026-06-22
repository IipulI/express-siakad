import { Router } from "express";
import * as StatusMahasiswaController from "../../controllers/akademik/status-mahasiswa.controller.js";

const router = new Router();

router.get("/", StatusMahasiswaController.findAll);
router.get("/:id", StatusMahasiswaController.findOneById);
router.post("/", StatusMahasiswaController.create);
router.put("/:id", StatusMahasiswaController.update);
router.delete('/:id', StatusMahasiswaController.destroy)

export default router;