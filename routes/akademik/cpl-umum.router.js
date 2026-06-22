// import express from 'express';
// import * as CplUmumController from '../../controllers/akademik/cpl-umum.controller.js';

// // 👇 INI YANG KETINGGALAN BANG! 😂
// const router = express.Router();

// // --- ROUTER CPL UMUM ---

// // GET: Ambil daftar CPL Umum beserta Header Kurikulum
// // URL Jadinya: GET /api/akademik/cpl-umum/:tahunKurikulumId
// router.get('/:tahunKurikulumId', CplUmumController.fetchCplUmum);

// // POST: Simpan baris baru atau update baris (Tergantung payload ada ID atau tidak)
// // URL Jadinya: POST /api/akademik/cpl-umum/:tahunKurikulumId
// router.post('/:tahunKurikulumId', CplUmumController.saveCplUmum);

// // DELETE: Hapus baris CPL Umum berdasarkan ID CPL-nya
// // URL Jadinya: DELETE /api/akademik/cpl-umum/:id
// router.delete('/:id', CplUmumController.deleteCplUmum);

// export default router;

import express from 'express';
import * as CplUmumController from '../../controllers/akademik/cpl-umum.controller.js';
import { validateGetCplUmum, validateSaveCplUmum, validateDeleteCplUmum } from '../../validators/cpl-umum.validator.js';

const router = express.Router();

// GET opsi dropdown Tingkat CPL (Universitas + daftar Fakultas) -- harus
// didaftarkan SEBELUM '/:tahunKurikulumId' supaya tidak ketangkap jadi param
router.get('/opsi/tingkat-cpl', CplUmumController.fetchOpsiTingkatCpl);

// GET
router.get('/:tahunKurikulumId', validateGetCplUmum, CplUmumController.fetchCplUmum);

// POST
router.post('/:tahunKurikulumId', validateSaveCplUmum, CplUmumController.saveCplUmum);

// DELETE
router.delete('/:id', validateDeleteCplUmum, CplUmumController.deleteCplUmum);

export default router;