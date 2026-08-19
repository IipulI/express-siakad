// import express from 'express';
// import * as EkivalensiController from '../../controllers/akademik/ekivalensi-mata-kuliah.controller.js';

// const router = express.Router();

// // READ: Menampilkan data tabel ekivalensi
// router.get('/', EkivalensiController.fetchListEkivalensi);

// // READ: Dropdown untuk sisi kanan (Kurikulum Lama)
// router.get('/dropdown-lama', EkivalensiController.fetchDropdownMkLama);

// // CREATE & UPDATE: Fungsi Simpan Massal (Mapping Kiri ke Kanan)
// router.post('/bulk', EkivalensiController.saveBulkEkivalensi);

// // DELETE: Menghapus mapping spesifik berdasarkan ID MK Baru
// router.delete('/:mkBaruId', EkivalensiController.deleteEkivalensiByMk);

// export default router;
import express from 'express';
import * as EkivalensiController from '../../controllers/akademik/ekivalensi-mata-kuliah.controller.js';
import { validateGetEkivalensi, validateGetDropdownMkLama, validateBulkSaveEkivalensi } from '../../validators/ekivalensi.validator.js';
import { validateIdParam } from '../../validators/mata-kuliah-kurikulum.validator.js';

const router = express.Router();

router.get('/', validateGetEkivalensi, EkivalensiController.fetchListEkivalensi);
router.get('/dropdown-lama', validateGetDropdownMkLama, EkivalensiController.fetchDropdownMkLama);
router.post('/bulk', validateBulkSaveEkivalensi, EkivalensiController.saveBulkEkivalensi);
router.delete('/:mkBaruId', EkivalensiController.deleteEkivalensiByMk);

export default router;