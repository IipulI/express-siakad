import { Router } from "express";
import TahunAjaranRouter from "./tahun-ajaran.router.js";
import PeriodeAkademikRouter from "./periode-akademik.router.js";
import TahunKurikulumRouter from "./tahun-kurikulum.router.js";
import MataKuliahRouter from "./mata-kuliah.router.js";
import KurikulumProdiRouter from "./kurikulum-prodi.router.js";
import KelasKuliahRouter from "./kelas-kuliah.router.js";
import RuanganRouter from "./ruangan.router.js";
import JenjangRouter from "./jenjang.router.js";
import PembimbingAkademikRouter from "./pembimbing-akademik.router.js";
import AgamaRouter from "./agama.router.js";
import SukuRouter from "./suku.router.js";
import KebutuhanKhususRouter from "./kebutuhan-khusus.router.js";
import PekerjaanRouter from "./pekerjaan.router.js";
import PendidikanRouter from "./pendidikan.router.js";
import PenghasilanPekerjaan from "./penghasilan-pekerjaan.router.js";

const router = Router();

router.use("/tahun-ajaran", TahunAjaranRouter);
router.use("/ruangan", RuanganRouter);
router.use("/periode-akademik", PeriodeAkademikRouter);
router.use("/tahun-kurikulum", TahunKurikulumRouter);
router.use("/mata-kuliah", MataKuliahRouter);
router.use("/kurikulum-prodi", KurikulumProdiRouter);
router.use("/jenjang", JenjangRouter);
router.use("/kebutuhan-khusus", KebutuhanKhususRouter);
router.use("/kelas-kuliah", KelasKuliahRouter);
router.use("/pembimbing-akademik", PembimbingAkademikRouter);
router.use("/agama", AgamaRouter);
router.use("/suku", SukuRouter);
router.use("/pekerjaan", PekerjaanRouter);
router.use("/pendidikan", PendidikanRouter);
router.use("/penghasilan-pekerjaan", PenghasilanPekerjaan);

export default router;
