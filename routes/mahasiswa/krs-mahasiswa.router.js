import { Router } from "express";
import * as KrsMahasiswaController from "../../controllers/mahasiswa/krs-mahasiswa.controller.js"

const router = new Router();

router.get('/', KrsMahasiswaController.getAvailableKrs)
router.get('/tersimpan', KrsMahasiswaController.savedKrs)
router.post('/', KrsMahasiswaController.saveKrs)
router.put('/:id', KrsMahasiswaController.updateKrs)
router.delete('/:id', KrsMahasiswaController.deleteKrs)

export default router;