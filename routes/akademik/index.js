import { Router } from "express";
import TahunAjaranRouter from "./tahun-ajaran.router.js";
import PeriodeAkademikRouter from "./periode-akademik.router.js";
import TahunKurikulumRouter from "./tahun-kurikulum.router.js";
import MataKuliahRouter from "./mata-kuliah.router.js";
import KurikulumProdiRouter from "./kurikulum-prodi.router.js";
import KelasKuliahRouter from "./kelas-kuliah.router.js";
import RuanganRouter from "./ruangan.router.js";
import JenjangRouter from "./jenjang.router.js";
import FakultasRouter from "./fakultas.router.js";
import PembimbingAkademikRouter from "./pembimbing-akademik.router.js";
import DosenRouter from "./dosen.router.js";
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
import TemplateEvaluasi from "./template-evaluasi.routes.js";
import GrupMk from "./grup-mk.route.js";
import KetentuanAkademik from "./ketentuan-akademik.route.js";
import SkalaNilai from "./skala-nilai.route.js";
import PredikatKelulusan from "./predikat-kelulusan.route.js";
import Ekivalensi from "./ekivalensi.route.js";
import MkKurikulum from "./mata-kuliah-kurikulum.route.js";
import BidangIlmuRouter from "./bidang-ilmu.router.js";
import JenisMataKuliahRouter from "./jenis-mata-kuliah.router.js";
import KelompokMataKuliahRouter from "./kelompok-mata-kuliah.router.js";
import MahasiswaRouter from "./mahasiswa.router.js";
import PengumumanRouter from "./pengumuman.router.js";
import SistemKuliahRouter from "./sistem-kuliah.router.js";
import StatusMahasiswaRouter from "./status-mahasiswa.router.js";
import TransportasiRouter from "./transportasi.router.js";
import JenisTinggalRouter from "./jenis-tinggal.router.js";

import EkivalensiMataKuliah from "./ekivalensi-mata-kuliah.router.js";
import SoalRouter from "./soal.route.js";
import CbtRouter from "./cbt.route.js";

import CPLUmum from "./cpl-umum.router.js";

import AturanEvaluasiRouter from "./aturan-evaluasi.router.js";
import KrsRouter from "./krs.router.js";
import MonitoringRouter from "./monitoring.router.js";
import koordinatorMkRouter from './koordinator-mk_router.js';
import dosenPengampuRouter from './dosen-pengampu_router.js';
import kaprodiRouter from './kaprodi_router.js';

const router = Router();

// --- PORTAL ---
// PENTING: /mahasiswa/hasil-studi HARUS didaftar SEBELUM /mahasiswa -- kalau
// kebalik, route /mahasiswa/:id (MahasiswaRouter) keburu nangkep duluan (nganggep
// "hasil-studi" itu :id, error invalid UUID) sebelum sempat sampai ke HasilStudiRouter.
router.use("/mahasiswa/hasil-studi", HasilStudiRouter)
router.use("/mahasiswa", MahasiswaRouter)
router.use("/dosen", DosenRouter)
router.use('/pengumuman', PengumumanRouter)

// --- PERKULIAHAN ---
// kurikulum
router.use("/mata-kuliah", MataKuliahRouter);
router.use("/kurikulum-prodi", KurikulumProdiRouter);
router.use("/tahun-kurikulum", TahunKurikulumRouter);
router.use("/rps", RpsRouter);
router.use("/obe", ObeRouter)
router.use("/batas-sks", BatasSks);
// CPL UMUM TAHUN AKADEMIK
router.use("/cpl-umum", CPLUmum);
//aturan evaluasi
router.use('/aturan-evaluasi', AturanEvaluasiRouter);


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

router.use("/template-evaluasi", TemplateEvaluasi)
router.use("/grup-mk", GrupMk)
router.use("/ketentuan-akademik", KetentuanAkademik)
router.use("/skala-nilai", SkalaNilai)
router.use("/predikat-kelulusan", PredikatKelulusan)
router.use("/ekivalensi", Ekivalensi)
router.use("/mata-kuliah-kurikulum", MkKurikulum)
router.use("/ekivalensi-mata-kuliah", EkivalensiMataKuliah)
router.use("/soal", SoalRouter) // Jalur C: penilaian per soal/unit
router.use("/cbt", CbtRouter) // Jalur D: integrasi CBT (soal & koreksi di CBT, NL-SIAK terima hasil agregat)
router.use("/monitoring", MonitoringRouter)

router.use('/koordinator-mk', koordinatorMkRouter);
router.use('/dosen', dosenPengampuRouter);
router.use('/kaprodi', kaprodiRouter);

export default router;
