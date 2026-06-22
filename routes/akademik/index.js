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
import PengumumanRouter from "./pengumuman.router.js";
import SistemKuliahRouter from "./sistem-kuliah.router.js";
import StatusMahasiswaRouter from "./status-mahasiswa.router.js";
import TransportasiRouter from "./transportasi.router.js";
import JenisTinggalRouter from "./jenis-tinggal.router.js";

const router = Router();

// --- PORTAL ---
router.use("/mahasiswa", MahasiswaRouter)
// Todo : Dosen (pegawai)
router.use('/pengumuman', PengumumanRouter)

// --- PERKULIAHAN ---
// kurikulum
router.use("/mata-kuliah", MataKuliahRouter);
router.use("/kurikulum-prodi", KurikulumProdiRouter);
router.use("/tahun-kurikulum", TahunKurikulumRouter);
router.use("/rps", RpsRouter);
router.use("/obe", ObeRouter)
router.use("/batas-sks", BatasSks);

// kelas kuliah
router.use("/kelas-kuliah", KelasKuliahRouter);
// Todo : Monitoring ruangan

// Administrasi
// Todo : status semester mahasiswa (rekap status mahasiswa pada semester ini)
router.use("/pembimbing-akademik", PembimbingAkademikRouter);
// Todo : mahasiswa keluar
// Todo : mahasiswa transfer


// --- MASTER DATA ---
// perguruan tinggi
// Todo : Data Perguruan Tinggi
// Todo : router.use("/fakultas", )
// Todo : router.use("/program-studi", )
// Todo : konsentrasi
router.use("/jenjang", JenjangRouter);
router.use("/sistem-kuliah", SistemKuliahRouter)
router.use("/ruangan", RuanganRouter);
router.use("/pendidikan", PendidikanRouter);

// perkuliahan
router.use("/bidang-ilmu", BidangIlmuRouter)
router.use("/jenis-mata-kuliah", JenisMataKuliahRouter)
router.use("/kelompok-mata-kuliah", KelompokMataKuliahRouter)
// Todo : jenis pertemuan

// biodata
router.use("/agama", AgamaRouter);
router.use("/pekerjaan", PekerjaanRouter);
router.use("/penghasilan-pekerjaan", PenghasilanPekerjaan);
router.use("/suku", SukuRouter);

// mahasiswa
router.use("/status-mahasiswa", StatusMahasiswaRouter)
router.use("/transportasi", TransportasiRouter)
router.use("/jenis-tinggal", JenisTinggalRouter)
router.use("/jalur-pendaftaran", JalurPendaftaran);
router.use("/kebutuhan-khusus", KebutuhanKhususRouter);


// --- PENGATURAN ---
router.use("/tahun-ajaran", TahunAjaranRouter);
router.use("/periode-akademik", PeriodeAkademikRouter);

router.use("/mahasiswa/hasil-studi", HasilStudiRouter)

export default router;
