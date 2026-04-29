// import express from 'express';
// import * as SkalaNilaiController from '../../controllers/akademik/skala-nilai.controller.js';

// const router = express.Router();

// router.get('/', SkalaNilaiController.fetchSkalaNilai);
// router.post('/', SkalaNilaiController.saveSkalaNilai);
// router.delete('/:id', SkalaNilaiController.destroySkalaNilai);

// export default router;
import express from 'express';
import * as SkalaNilaiController from '../../controllers/akademik/skala-nilai.controller.js';
import { validateGetSkalaNilai, validateUpsertSkalaNilai } from '../../validators/skala-nilai.validator.js';
import { validateIdParam } from '../../validators/mata-kuliah-kurikulum.validator.js'; // Pakai yang sudah ada

const router = express.Router();

router.get('/', validateGetSkalaNilai, SkalaNilaiController.fetchSkalaNilai);
router.post('/', validateUpsertSkalaNilai, SkalaNilaiController.saveSkalaNilai);
router.delete('/:id', validateIdParam, SkalaNilaiController.destroySkalaNilai);

export default router;