import express from 'express';
import * as SoalController from '../../controllers/akademik/soal.controller.js';
import {
    validateRencanaEvaluasiIdParam, validateSoalIdParam,
    validateCreateSoal, validateCreateSoalBatch, validateUpdateSoal, validateInputNilaiPerSoal
} from '../../validators/soal.validator.js';

const router = express.Router();

// CRUD Soal (rubrik per komponen evaluasi) — Jalur C
router.get('/komponen/:rencanaEvaluasiId', validateRencanaEvaluasiIdParam, SoalController.fetchSoalByKomponen);
router.post('/komponen/:rencanaEvaluasiId', validateCreateSoal, SoalController.postSoal);
router.post('/komponen/:rencanaEvaluasiId/batch', validateCreateSoalBatch, SoalController.postSoalBatch);
router.put('/:soalId', validateUpdateSoal, SoalController.putSoal);
router.delete('/:soalId', validateSoalIdParam, SoalController.deleteSoal);

// Input nilai per soal (Jalur C)
router.post('/nilai/:krsId', validateInputNilaiPerSoal, SoalController.postNilaiPerSoal);

export default router;
