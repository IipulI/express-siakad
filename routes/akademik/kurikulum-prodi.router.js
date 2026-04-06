// import { Router } from 'express';
// import * as KurikulumProdiController from '../../controllers/akademik/kurikulum-prodi.controller.js'

// const router = new Router();

// router.get('/', KurikulumProdiController.fetchKurikulumProdi)
// router.put('/:id', KurikulumProdiController.addCourseToKurikulumProdi)
// router.delete('/:id', KurikulumProdiController.deleteCourseFromKurikulumProdi)

// export default router;

import express from 'express';
import * as KurikulumProdiController from '../../controllers/akademik/kurikulum-prodi.controller.js';

const router = express.Router();

// Halaman Depan: Rekap Tahun Kurikulum
router.get('/rekap-tahun', KurikulumProdiController.fetchRekapTahunKurikulum);

// Halaman Detail: Daftar Prodi & Status OBE-nya
router.get('/list', KurikulumProdiController.fetchListProdi);

// Modal Simpan: Set aturan OBE & Target Capaian
router.post('/set-obe', KurikulumProdiController.updateAturanObe);

export default router;