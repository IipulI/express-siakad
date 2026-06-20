import express from 'express';
import * as SkalaNilaiController from '../../controllers/akademik/skala-nilai.controller.js';
import {
    validateGetSkalaNilai,
    validateUpsertSkalaNilai,
    validateGetPratinjauSalinSkalaNilai,
    validateSalinSkalaNilai
} from '../../validators/skala-nilai.validator.js';
import { validateIdParam } from '../../validators/mata-kuliah-kurikulum.validator.js'; // Pakai yang sudah ada

const router = express.Router();

router.get('/', validateGetSkalaNilai, SkalaNilaiController.fetchSkalaNilai);
router.post('/', validateUpsertSkalaNilai, SkalaNilaiController.saveSkalaNilai);
router.get('/pratinjau-salin', validateGetPratinjauSalinSkalaNilai, SkalaNilaiController.fetchPratinjauSalinSkalaNilai);
router.post('/salin', validateSalinSkalaNilai, SkalaNilaiController.postSalinSkalaNilai);
router.delete('/:id', validateIdParam, SkalaNilaiController.destroySkalaNilai);

export default router;
