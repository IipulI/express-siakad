import { Router } from 'express';
import * as MahasiswaController from '../../controllers/akademik/mahasiswa.controller.js';
import multer from 'multer';

const router = new Router();

const upload = multer(); // memory storage, no files expected

router.get('/', MahasiswaController.findAll)
router.get('/:id', MahasiswaController.findOne)

router.post('/', upload.none(), MahasiswaController.create)
router.put('/:id', MahasiswaController.update)
router.delete('/:id', MahasiswaController.remove)

export default router;