import { Router } from 'express';
import * as MataKuliahController from '../../controllers/akademik/mata-kuliah.controller.js'

const router = new Router();

router.get('/', MataKuliahController.findAll)
router.get('/:id', MataKuliahController.findOne)
router.post('/', MataKuliahController.create)
router.put('/:id', MataKuliahController.update)
router.delete('/:id', MataKuliahController.destroy)

export default router;