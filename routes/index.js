import { Router } from 'express';
import akademikRoutes from './akademik/index.js';
import mahasiswaRoutes from './mahasiswa/index.js';
import dosenRoutes from './dosen/index.js';
import orangTuaRoutes from './orang-tua/index.js';
import dosenPengampuRouter from './akademik/dosen-pengampu_router.js';
import kaprodiRouter from './akademik/kaprodi_router.js';
import koordinatorMkRouter from './akademik/koordinator-mk_router.js';
import { checkBlacklist, verifySsoToken } from "../middleware/auth.middleware.js";
import * as programStudiController from "../controllers/akademik/program-studi.controller.js"
import { attachUser } from "../middleware/attachUser.middleware.js";
import { requireAdmin, requireDosen, requireMahasiswa } from "../middleware/role.middleware.js";
import ssoRoutes from '../routes/sso/sso.js';
import validateMahasiswaRoutes from './external/validateMahasiswa.routes.js';
import * as authController from '../controllers/auth.controller.js'
import { findAll } from "../controllers/akademik/periode-akademik.controller.js"
import publicRouter from "./public.js";

const router = Router();
// app.js / index.js — daftarkan route

router.use('/sso', ssoRoutes);
router.use('/external/validate', validateMahasiswaRoutes);
// Global route
router.post('/auth/login', authController.login)
router.get('/periode-akademik/dropdown', findAll)
router.get('/program-studi', programStudiController.findAll)

router.use('/public', publicRouter)

// [Nilai Perkuliahan dkk] -- /akademik/dosen, /akademik/kaprodi, /akademik/koordinator-mk
// harus di-mount DULUAN, TANPA requireAdmin: masing-masing sub-router-nya
// (dosen-pengampu_router.js, kaprodi_router.js, koordinator-mk_router.js) sudah
// ngecek sendiri (dosen yang beneran ngampu/kaprodi/koordinator MK, ATAU admin
// akademik). Kalau requireAdmin blanket di bawah kena duluan, dosen/kaprodi/
// koordinator MK ke-403 sebelum sempat nyampe ke pengecekan yang lebih spesifik
// itu -- endpoint kelihatan "punya admin" padahal harusnya bisa diakses dosen.
router.use('/akademik/dosen', verifySsoToken, checkBlacklist, attachUser, dosenPengampuRouter);
router.use('/akademik/kaprodi', verifySsoToken, checkBlacklist, attachUser, kaprodiRouter);
router.use('/akademik/koordinator-mk', verifySsoToken, checkBlacklist, attachUser, koordinatorMkRouter);
router.use('/akademik', verifySsoToken, checkBlacklist, attachUser, requireAdmin, akademikRoutes);
router.use('/mahasiswa', verifySsoToken, checkBlacklist, attachUser, requireMahasiswa, mahasiswaRoutes)
router.use('/dosen', verifySsoToken, checkBlacklist, attachUser, requireDosen, dosenRoutes)
router.use('/orang-tua', orangTuaRoutes)

export default router;