import { Router } from 'express';
import * as MahasiswaController from '../../controllers/akademik/mahasiswa.controller.js';

const router = new Router();

router.get('/', MahasiswaController.findAll)
router.get('/:id', MahasiswaController.findOne)

router.post('/', MahasiswaController.create)

export default router;