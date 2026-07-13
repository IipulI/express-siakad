import express from 'express';
import * as CbtController from '../../controllers/akademik/cbt.controller.js';
import { validatePostNilaiDariCbt } from '../../validators/cbt.validator.js';

const router = express.Router();

// Jalur D — integrasi CBT: terima nilai akhir komponen + breakdown per Sub-CPMK
router.post('/komponen/:rencanaEvaluasiId/nilai', validatePostNilaiDariCbt, CbtController.postNilaiDariCbt);

export default router;
