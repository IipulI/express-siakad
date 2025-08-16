import { Router } from "express";
import TahunAjaranRouter from "./tahun-ajaran.router.js";
import PeriodeAkademikRouter from "./periode-akademik.router.js";
import TahunKurikulumRouter from "./tahun-kurikulum.router.js";
import MataKuliahRouter from "./mata-kuliah.router.js";
import KurikulumProdiRouter from "./kurikulum-prodi.router.js";
import KelasKuliahRouter from "./kelas-kuliah.router.js";
import RuanganRouter from "./ruangan.router.js";
import PembimbingAkademikRouter from "./pembimbing-akademik.router.js";
import AgamaRouter from "./agama.router.js"
import SukuRouter from "./suku.router.js"

const router = Router();

router.use("/tahun-ajaran", TahunAjaranRouter);
router.use("/ruangan", RuanganRouter);
router.use("/periode-akademik", PeriodeAkademikRouter);
router.use("/tahun-kurikulum", TahunKurikulumRouter);
router.use("/mata-kuliah", MataKuliahRouter);
router.use("/kurikulum-prodi", KurikulumProdiRouter);
router.use("/kelas-kuliah", KelasKuliahRouter);
router.use("/pembimbing-akademik", PembimbingAkademikRouter)
router.use("/agama", AgamaRouter)
router.use("/suku", SukuRouter)

export default router;
