import express from 'express';
import * as TemplateController from '../../controllers/akademik/template-evaluasi.controller.js';

const router = express.Router();
router.get('/', TemplateController.getListTemplate);

// GET: /api/akademik/template-evaluasi/detail?kurikulumId=...&prodiId=...&jenisMk=Kuliah
router.get('/detail', TemplateController.getDetailTemplate);

// POST: /api/akademik/template-evaluasi
router.post('/', TemplateController.saveTemplate);

// DELETE: /api/akademik/template-evaluasi?kurikulumId=...&prodiId=...&jenisMk=Kuliah
router.delete('/', TemplateController.deleteTemplate);

export default router;