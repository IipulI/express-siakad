import { Router } from 'express';
import * as KelasKuliahController from '../../controllers/akademik/kelas-kuliah.controller.js'

const router = new Router();

router.get('/', KelasKuliahController.findAll)
router.get('/:id', KelasKuliahController.findOne)
router.get('/:id/schedule', KelasKuliahController.schedules)
router.get('/:id/participant', KelasKuliahController.classParticipant)

export default router;