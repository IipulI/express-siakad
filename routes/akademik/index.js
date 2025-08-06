import { Router } from "express";
import TahunAjaranRouter from "./tahun-ajaran.router.js";
import PeriodeAkademikRouter from "./periode-akademik.router.js";
import TahunKurikulumRouter from "./tahun-kurikulum.router.js";

const router = Router();

router.use("/tahun-ajaran", TahunAjaranRouter);
router.use("/periode-akademik", PeriodeAkademikRouter);
router.use("/tahun-kurikulum", TahunKurikulumRouter);

export default router;
