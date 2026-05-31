import { Router } from 'express';
import * as dosenPembimbingAkademikController from '../../controllers/dosen/pembimbing-akademik.controller.js'
import { acceptKrsMahasiswa, rejectKrsMahasiswa } from '../../controllers/akademik/pembimbing-akademik.controller.js'

const router = new Router();

router.get('/all', dosenPembimbingAkademikController.getAllAssignedMahasiswa)
router.post('/setuju', acceptKrsMahasiswa);
router.post('/tolak', rejectKrsMahasiswa);

export default router;