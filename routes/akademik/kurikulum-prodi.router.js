import { Router } from 'express';
import * as KurikulumProdiController from '../../controllers/akademik/kurikulum-prodi.controller.js'

const router = new Router();

router.get('/', KurikulumProdiController.fetchKurikulumProdi)
router.put('/:id', KurikulumProdiController.addCourseToKurikulumProdi)
router.delete('/:id', KurikulumProdiController.deleteCourseFromKurikulumProdi)

export default router;