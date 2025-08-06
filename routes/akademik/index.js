import { Router } from "express";
import tahunAjaranRouter from "./tahun-ajaran.router.js";
import PeriodeAkademikRouter from "./periode-akademik.router.js";
import RuanganRouter from "./ruangan.router.js";

const router = Router();

router.use("/tahun-ajaran", tahunAjaranRouter);
router.use("/periode-akademik", PeriodeAkademikRouter);
router.use("/ruangan", RuanganRouter);

export default router;
