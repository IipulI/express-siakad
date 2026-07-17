import express from 'express';
import * as CbtController from '../../controllers/akademik/cbt.controller.js';
import {
    validatePostNilaiDariCbt, validatePostNilaiAkhirDariCbt,
    validateRencanaEvaluasiIdParam, validateResetKomponenCbt
} from '../../validators/cbt.validator.js';

const router = express.Router();

// Jalur D — integrasi CBT: breakdown per Sub-CPMK per komponen (dipakai hitung CPMK)
router.post('/komponen/:rencanaEvaluasiId/nilai', validatePostNilaiDariCbt, CbtController.postNilaiDariCbt);
router.get('/komponen/:rencanaEvaluasiId/nilai', validateRencanaEvaluasiIdParam, CbtController.getNilaiDariCbt);
router.delete('/komponen/:rencanaEvaluasiId/nilai/:krsId', validateResetKomponenCbt, CbtController.deleteNilaiKomponenCbt);

// Jalur D — nilai akhir + huruf mutu + angka mutu MK, sync langsung dari CBT
// (level MK, bukan per komponen, tidak dihitung ulang sama sekali)
router.post('/nilai-akhir', validatePostNilaiAkhirDariCbt, CbtController.postNilaiAkhirDariCbt);

export default router;
