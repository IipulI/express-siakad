import { Router } from 'express';
import * as KelasKuliahController from '../../controllers/akademik/kelas-kuliah.controller.js'

const router = new Router();

router.get('/', KelasKuliahController.findAll)

export default router;