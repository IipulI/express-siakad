import { Router } from "express";
import * as kelasKuliahController from  "../../controllers/dosen/kelas-kuliah.controller.js"
import { cekKepemilikanKelas } from '../../middleware/require-koordinator-mk.middleware.js';

const router = Router();

// FIX 2026-08-19: /:id, /:id/peserta-kelas, /:id/grading sebelumnya gak ada
// pengecekan kepemilikan sama sekali -- siapa aja yang login bisa lihat detail
// & peserta kelas kuliah MANAPUN cuma modal tau ID-nya. "/" (list) sendiri udah
// aman dari sononya karena filternya sendiri di controller (siakDosenId = dosen
// yang login), gak perlu cekKepemilikanKelas.
router.get('/', kelasKuliahController.getKelasKuliah)
router.get('/:id', cekKepemilikanKelas, kelasKuliahController.getDetailKelasKuliah)
router.get('/:id/peserta-kelas', cekKepemilikanKelas, kelasKuliahController.getPesertaKelasKuliah)
router.get('/:id/grading', cekKepemilikanKelas, kelasKuliahController.getGradingKelasKuliah)

export default router;