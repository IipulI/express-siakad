import { Router } from 'express';
import tahunAjaranRouter from "./tahun-ajaran.router.js";
import PeriodeAkademikRouter from "./periode-akademik.router.js";

const router = Router();

router.use('/tahun-ajaran', tahunAjaranRouter);
router.use('/periode-akademik', PeriodeAkademikRouter);

export default router;