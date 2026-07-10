import { Router } from 'express';
import * as MahasiswaController from '../../controllers/akademik/mahasiswa.controller.js';
import multer from 'multer';

const router = new Router();

const upload = multer(); // memory storage, no files expected
console.log(typeof multer);       // should print 'function'
console.log(typeof upload);       // should print 'object'
console.log(typeof upload.none);  // should print 'function'

router.get('/', MahasiswaController.findAll)
router.get('/:id', MahasiswaController.findOne)

router.post('/', upload.none(), MahasiswaController.create)

export default router;