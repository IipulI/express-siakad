import express from 'express';
import { validateNpm } from '../../controllers/mahasiswa/validateMahasiswa.controller.js';

const router = express.Router();

router.get('/npm', validateNpm);

export default router;