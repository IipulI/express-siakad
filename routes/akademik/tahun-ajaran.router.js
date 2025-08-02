import { Router } from 'express';
import * as tahunAjaranController from '../../controllers/akademik/tahun-ajaran.controller.js'
import { validateCreateTahunAjaran } from '../../validators/tahun-ajaran.validator.js';

const router = new Router();

router.get('/', tahunAjaranController.findAll)
router.post('/', validateCreateTahunAjaran, tahunAjaranController.create)
router.put('/:id', tahunAjaranController.updateTahunAjaran)
router.delete('/:id', tahunAjaranController.deleteTahunAjaran)

export default router;