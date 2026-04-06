import express from 'express';
import * as PredikatController from '../../controllers/akademik/predikat-kelulusan.controller.js';

const router = express.Router();

router.get('/', PredikatController.fetchAll);
router.post('/', PredikatController.create);
router.put('/:id', PredikatController.update);
router.delete('/:id', PredikatController.destroy);

export default router;