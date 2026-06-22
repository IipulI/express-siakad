import express from 'express';
import * as EkivalensiController from '../../controllers/akademik/ekivalensi.controller.js';

const router = express.Router();

router.get('/', EkivalensiController.fetchDaftarEkivalensi);
router.post('/', EkivalensiController.saveEkivalensi);
router.delete('/:id', EkivalensiController.removeEkivalensi);

export default router;