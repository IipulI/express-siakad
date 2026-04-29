// import express from 'express';
// import * as AturanEvaluasiController from '../../controllers/akademik/aturan-evaluasi.controller.js';

// const router = express.Router();

// // GET: Ambil data berdasarkan Kurikulum dan Jenjang
// router.get('/:tahunKurikulumId/jenjang/:jenjangId', AturanEvaluasiController.fetchAturanEvaluasi);

// // POST: Simpan data ke Kurikulum dan Jenjang tertentu
// router.post('/:tahunKurikulumId/jenjang/:jenjangId', AturanEvaluasiController.saveAturanEvaluasi);

// // DELETE: Hapus berdasarkan ID baris aturan
// router.delete('/:id', AturanEvaluasiController.deleteAturanEvaluasi);

// export default router;
import express from 'express';
import * as AturanEvaluasiController from '../../controllers/akademik/aturan-evaluasi.controller.js';
import { 
    validateGetAturanEvaluasi, 
    validateSaveAturanEvaluasi, 
    validateIdParam 
} from '../../validators/aturan-evaluasi.validator.js';

const router = express.Router();

// GET List & Header
router.get('/', validateGetAturanEvaluasi, AturanEvaluasiController.fetchAturanEvaluasi);

// POST: Simpan Baru / Update (Jika ada ID di body)
router.post('/', validateSaveAturanEvaluasi, AturanEvaluasiController.saveAturanEvaluasi);

// DELETE: Hapus per baris
router.delete('/:id', validateIdParam, AturanEvaluasiController.deleteAturanEvaluasi);

export default router;