import { Router } from 'express';
import akademikRoutes from './akademik/index.js';
import mahasiswaRoutes from './mahasiswa/index.js';
import { verifySsoToken } from "../middleware/auth.middleware.js";
import { attachUser } from "../middleware/attachUser.middleware.js";

const router = Router();

// Mount the user routes at /users
router.use('/akademik', akademikRoutes);
router.use('/mahasiswa', verifySsoToken, attachUser, mahasiswaRoutes)

export default router;