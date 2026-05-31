import { Router } from 'express';
import * as KrsController from '../../controllers/akademik/krs.controller.js';

const router = new Router();

// Route POST resmi untuk membuat KRS Mahasiswa
router.post('/', KrsController.createKrs);

export default router;
