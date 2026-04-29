
// import express from 'express';
// import * as KurikulumProdiController from '../../controllers/akademik/kurikulum-prodi.controller.js';

// const router = express.Router();

// // Halaman Depan: Rekap Tahun Kurikulum
// router.get('/rekap-tahun', KurikulumProdiController.fetchRekapTahunKurikulum);

// // Halaman Detail: Daftar Prodi & Status OBE-nya
// router.get('/list', KurikulumProdiController.fetchListProdi);

// // Modal Simpan: Set aturan OBE & Target Capaian
// router.post('/set-obe', KurikulumProdiController.updateAturanObe);

// export default router;

import express from 'express';
import * as KurikulumProdiController from '../../controllers/akademik/kurikulum-prodi.controller.js';
import { validateRekapTahun, validateListProdi, validateSetObe, validateDetailKurikulum, validateUpdateObeBulk, validateStoreKurikulum } from '../../validators/kurikulum-prodi.validator.js';

const router = express.Router();
router.post('/', validateStoreKurikulum, KurikulumProdiController.storeKurikulum);

router.get('/rekap-tahun', validateRekapTahun, KurikulumProdiController.fetchRekapTahunKurikulum);
router.get('/list', validateListProdi, KurikulumProdiController.fetchListProdi);


// Halaman Detail: Gabungan Header + List Prodi (Tanpa Pagination)
router.get('/detail', validateDetailKurikulum, KurikulumProdiController.fetchListProdi);

// Update OBE (Wipe & Replace / Update per row)
// Ganti validateSetObe (kalau ada) jadi validateUpdateObeBulk
router.post('/set-obe', validateUpdateObeBulk, KurikulumProdiController.updateAturanObe);
export default router;