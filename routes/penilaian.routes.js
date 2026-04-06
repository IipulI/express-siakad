import { Router } from "express";
import * as PenilaianController from '../../controllers/akademik/penilaian.controller.js';

const router = new Router();

// Endpoint untuk Dropdown Master Evaluasi
router.get('/master/dropdown-evaluasi', PenilaianController.getDropdownMasterEvaluasi);
// Endpoint untuk dosen mengatur RPS (persentase)
router.post('/mata-kuliah/:mataKuliahId/setup-evaluasi', PenilaianController.setupKomposisiRPS);

// Endpoint untuk dosen menginput nilai dinamis
router.post('/krs/:krsId/input-nilai', PenilaianController.simpanNilaiMahasiswa);

// Endpoint untuk melihat agregasi rapor ketercapaian OBE (Persentase CPL)
router.get('/krs/:krsId/rapor-obe', PenilaianController.getRaporOBE);

export default router;