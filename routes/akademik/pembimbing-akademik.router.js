import { Router } from 'express';
import * as pembimbingAkademikController from '../../controllers/akademik/pembimbing-akademik.controller.js'

const router = new Router();

router.get('/', pembimbingAkademikController.getMahasiswa)
router.post('/assign-lecturer', pembimbingAkademikController.assignDosen)
router.post('/accept', pembimbingAkademikController.acceptKrsMahasiswa);
router.post('/reject', pembimbingAkademikController.rejectKrsMahasiswa);

export default router;