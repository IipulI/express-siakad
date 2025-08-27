import { Router } from 'express';
import * as HasilStudiController from '../../controllers/akademik/hasil-studi.controller.js'

const router = new Router();

router.get('/', HasilStudiController.getHasilStudi)
router.get('/test', HasilStudiController.test)

export default router;