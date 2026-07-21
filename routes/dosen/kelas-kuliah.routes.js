import { Router } from "express";
import * as kelasKuliahController from  "../../controllers/dosen/kelas-kuliah.controller.js"

const router = Router();

router.get('/', kelasKuliahController.getKelasKuliah)
router.get('/:id', kelasKuliahController.getDetailKelasKuliah)
router.get('/:id/peserta-kelas', kelasKuliahController.getPesertaKelasKuliah)
router.get('/:id/grading', kelasKuliahController.getGradingKelasKuliah)

export default router;