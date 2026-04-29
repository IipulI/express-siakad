// import express from 'express';
// import * as TemplateController from '../../controllers/akademik/template-evaluasi.controller.js';

// const router = express.Router();
// router.get('/', TemplateController.getListTemplate);

// // GET: /api/akademik/template-evaluasi/detail?kurikulumId=...&prodiId=...&jenisMk=Kuliah
// router.get('/detail', TemplateController.getDetailTemplate);

// // POST: /api/akademik/template-evaluasi
// router.post('/', TemplateController.saveTemplate);

// // DELETE: /api/akademik/template-evaluasi?kurikulumId=...&prodiId=...&jenisMk=Kuliah
// router.delete('/', TemplateController.deleteTemplate);

// export default router;

import express from 'express';
import * as TemplateController from '../../controllers/akademik/template-evaluasi.controller.js';
import { 
    validateGetListTemplate, 
    validateGetDetailTemplate, 
    validateSaveTemplate 
} from '../../validators/template-evaluasi.validator.js';

const router = express.Router();

/**
 * @route   GET /api/akademik/template-evaluasi
 * @desc    Ambil daftar template evaluasi (Grouping per Prodi & Kurikulum)
 * @access  Private
 */
router.get(
    '/', 
    validateGetListTemplate, 
    TemplateController.getListTemplate
);

/**
 * @route   GET /api/akademik/template-evaluasi/detail
 * @desc    Ambil detail komponen evaluasi & pelaporan metode evaluasi
 * @access  Private
 */
router.get(
    '/detail', 
    validateGetDetailTemplate, 
    TemplateController.getDetailTemplate
);

/**
 * @route   POST /api/akademik/template-evaluasi
 * @desc    Simpan/Update template secara massal (Wipe & Replace)
 * @access  Private
 */
router.post(
    '/', 
    validateSaveTemplate, 
    TemplateController.saveTemplate
);

/**
 * @route   DELETE /api/akademik/template-evaluasi
 * @desc    Hapus satu paket template berdasarkan kriteria header
 * @access  Private
 */
router.delete(
    '/', 
    validateGetDetailTemplate, // Pakai validator yang sama dengan detail karena query param-nya identik
    TemplateController.deleteTemplate
);

export default router;