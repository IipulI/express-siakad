import express from 'express';
import * as SkalaNilaiController from '../../controllers/akademik/skala-nilai.controller.js';

const router = express.Router();

router.get('/', SkalaNilaiController.fetchSkalaNilai);
router.post('/', SkalaNilaiController.saveSkalaNilai);
router.delete('/:id', SkalaNilaiController.destroySkalaNilai);

export default router;