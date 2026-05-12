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
import HasilStudiRouter from "./hasil-studi.router.js";
import ObeRouter from "./obe.router.js";
import RpsRouter from "./rps.router.js";
import BatasSks from "./batas-sks.router.js";
import JalurPendaftaran from "./jalur-pendaftaran.router.js";
import BidangIlmuRouter from "./bidang-ilmu.router.js";
import JenisMataKuliahRouter from "./jenis-mata-kuliah.router.js";
import KelompokMataKuliahRouter from "./kelompok-mata-kuliah.router.js";
import MahasiswaRouter from "./mahasiswa.router.js";

const router = Router();

// --- AKADEMIK ---
// kurikulum
router.use("/mata-kuliah", MataKuliahRouter);
router.use("/kurikulum-prodi", KurikulumProdiRouter);
router.use("/tahun-kurikulum", TahunKurikulumRouter);
router.use("/rps", RpsRouter);
router.use("/obe", ObeRouter)
router.use("/batas-sks", BatasSks);

// kelas kuliah
router.use("/kelas-kuliah", KelasKuliahRouter);


// --- MAHASISWA ---
router.use("/mahasiswa", MahasiswaRouter)
router.use("/pembimbing-akademik", PembimbingAkademikRouter);


// --- MASTER DATA ---
// perguruan tinggi
router.use("/ruangan", RuanganRouter);
router.use("/jenjang", JenjangRouter);
// router.use("/fakultas", )
// router.use("/program-studi", )

// perkuliahan
router.use("/tahun-ajaran", TahunAjaranRouter);
router.use("/bidang-ilmu", BidangIlmuRouter)
router.use("/jenis-mata-kuliah", JenisMataKuliahRouter)
router.use("/kelompok-mata-kuliah", KelompokMataKuliahRouter)

// biodata
router.use("/agama", AgamaRouter);
router.use("/pekerjaan", PekerjaanRouter);
router.use("/penghasilan-pekerjaan", PenghasilanPekerjaan);
router.use("/suku", SukuRouter);
router.use("/pendidikan", PendidikanRouter);

// mahasiswa
router.use("/jalur-pendaftaran", JalurPendaftaran);
router.use("/kebutuhan-khusus", KebutuhanKhususRouter);


// --- PENGATURAN ---
router.use("/periode-akademik", PeriodeAkademikRouter);

router.use("/mahasiswa/hasil-studi", HasilStudiRouter)

export default router;
