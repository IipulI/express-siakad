import { Router } from 'express';
import * as KelasKuliahController from '../../controllers/akademik/kelas-kuliah.controller.js'

const router = new Router();

router.get('/', KelasKuliahController.findAll)
router.post('/', KelasKuliahController.create)
router.get('/:id', KelasKuliahController.findOne)
router.put('/:id', KelasKuliahController.update)
router.delete('/:id', KelasKuliahController.remove)
router.get('/:id/schedule', KelasKuliahController.schedules)
router.post('/:id/schedule', KelasKuliahController.addSchedule)
router.delete('/:id/schedule/:jadwalId', KelasKuliahController.deleteSchedule)
router.get('/:id/participant', KelasKuliahController.classParticipant)
router.post('/:id/participant', KelasKuliahController.addClassParticipant)
router.get('/:id/grading', KelasKuliahController.getGradingClass)
router.post('/:id/grading', KelasKuliahController.submitGradingClass)

// router.get('/test/test', KelasKuliahController.test)

export default router;