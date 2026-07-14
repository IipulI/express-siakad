import express from 'express';
import * as CbtController from '../../controllers/akademik/cbt.controller.js';
import { validatePostNilaiDariCbt, validateRencanaEvaluasiIdParam, validateResetKomponenCbt } from '../../validators/cbt.validator.js';

const router = express.Router();

// Jalur D — integrasi CBT: terima nilai akhir komponen + breakdown per Sub-CPMK
router.post('/komponen/:rencanaEvaluasiId/nilai', validatePostNilaiDariCbt, CbtController.postNilaiDariCbt);
router.get('/komponen/:rencanaEvaluasiId/nilai', validateRencanaEvaluasiIdParam, CbtController.getNilaiDariCbt);
router.delete('/komponen/:rencanaEvaluasiId/nilai/:krsId', validateResetKomponenCbt, CbtController.deleteNilaiKomponenCbt);

export default router;
