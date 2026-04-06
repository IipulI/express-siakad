import express from 'express';
import * as MkKurikulumController from '../../controllers/akademik/mata-kuliah-kurikulum.controller.js';

const router = express.Router();

// Route Halaman 1 (Tabel Kurikulum Utama)
router.get('/rekap-sks', MkKurikulumController.fetchRekapDistribusiSks);

// Route Halaman Detail (Tabel Semester 1, Semester 2, dst)
router.get('/per-semester', MkKurikulumController.fetchMataKuliahPerSemester);

export default router;