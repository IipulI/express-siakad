import { Router } from 'express';
import * as tahunKurikulumController from '../../controllers/akademik/tahun-kurikulum.controller.js'

const router = new Router();

router.get('/', tahunKurikulumController.findAll)
router.post('/', tahunKurikulumController.create)
router.put('/:id', tahunKurikulumController.update)
router.delete('/:id', tahunKurikulumController.destroy)

export default router;