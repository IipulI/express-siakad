import { Router } from 'express';
import * as periodeAkademikController from '../../controllers/akademik/periode-akademik.controller.js'
import { validateCreatePeriodeAkademik }  from '../../validators/periode-akademik.validators.js'

const router = new Router();

router.get('/', periodeAkademikController.findAll)
router.post('/', validateCreatePeriodeAkademik, periodeAkademikController.create)
router.put('/:id', periodeAkademikController.updatePeriodeAkademik)
router.delete('/:id', periodeAkademikController.deletePeriodeAkademik)

export default router;