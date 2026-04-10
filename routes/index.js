import { Router } from 'express';
import akademikRoutes from './akademik/index.js';
import mahasiswaRoutes from './mahasiswa/index.js';
import { verifySsoToken } from "../middleware/auth.middleware.js";
import { attachUser } from "../middleware/attachUser.middleware.js";
import * as authController from '../controllers/auth.controller.js'
import { findAll } from "../controllers/akademik/periode-akademik.controller.js"

const router = Router();

// Global route
router.post('/auth/login', authController.login)
router.get('/periode-akademik/dropdown', findAll)
router.get('/program-studi', programStudiController.findAll)

router.use('/akademik', akademikRoutes);
router.use('/mahasiswa', verifySsoToken, mahasiswaRoutes)

export default router;