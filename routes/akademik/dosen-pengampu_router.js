import express from 'express';
import * as MataKuliahController from '../../controllers/akademik/mata-kuliah.controller.js';
import * as CpmkController from '../../controllers/akademik/cpmk.controller.js';
import * as RpsController from '../../controllers/akademik/rps.controller.js';
import * as PenilaianController from '../../controllers/akademik/penilaian.controller.js';
import * as KelasKuliahController from '../../controllers/akademik/kelas-kuliah.controller.js';
import * as CapaianController from '../../controllers/akademik/capaian-pembelajaran.controller.js';
import * as exportExcelCapaianKelas from '../../controllers/akademik/export-nilai-kelas.controller.js';
import models from '../../models/index.js';
import { isAdminAkademik } from '../../middleware/require-koordinator-mk.middleware.js';

const { JadwalKuliah } = models;

// FIX 2026-08-19: dua middleware ini sebelumnya CUMA placeholder (`next()` doang,
// gak ada pengecekan apapun) -- artinya siapa aja yang login bisa lihat DAN UBAH
// nilai/kunci nilai/capaian kelas kuliah MANAPUN, bukan cuma kelas yang dia ampu
// sendiri. Sekarang beneran ngecek lewat siak_jadwal_kuliah (tabel yang sama yang
// nentuin kelas mana yang muncul di "Kelas Kuliah"-nya dosen), sama kayak pola
// requireKoordinatorMK di koordinator-mk_router.js. Admin akademik selalu boleh
// lewat (dia yang pakai endpoint yang sama ini juga dari halaman admin).
const requireDosenPengampu = (req, res, next) => {
    if (isAdminAkademik(req) || req.user?.dosen?.id) return next();
    return res.status(403).json({ status: 403, message: 'Hanya dosen atau admin akademik yang bisa mengakses menu ini.' });
};

const cekKepemilikanKelas = async (req, res, next) => {
    try {
        if (isAdminAkademik(req)) return next();

        const dosenId = req.user?.dosen?.id;
        if (!dosenId) {
            return res.status(403).json({ status: 403, message: 'Hanya dosen atau admin akademik yang bisa mengakses menu ini.' });
        }

        const kelasKuliahId = req.params.id || req.params.kelasId || req.params.krsId;
        const ampu = await JadwalKuliah.findOne({
            where: { siakKelasKuliahId: kelasKuliahId, siakDosenId: dosenId },
            attributes: ['id'],
        });
        if (!ampu) {
            return res.status(403).json({ status: 403, message: 'Anda bukan pengajar kelas ini, tidak dapat mengakses datanya.' });
        }

        next();
    } catch (error) {
        next(error);
    }
};

const router = express.Router();
router.use(requireDosenPengampu);

// ============================================================
// SIDEBAR MATA KULIAH (READ ONLY untuk dosen)
// Semua edit dilakukan oleh Koordinator MK
// ============================================================

// [1] Data Mata Kuliah - lihat saja
router.get('/mata-kuliah', MataKuliahController.getDaftarMataKuliahObe);
router.get('/mata-kuliah/:id', MataKuliahController.getDetailMataKuliahObe);

// [2] Pemetaan CPL - lihat saja
router.get('/mata-kuliah/:id/pemetaan-cpl', MataKuliahController.getCplMapping);

// [3] Pemetaan CPMK - lihat saja
router.get('/mata-kuliah/:id/pemetaan-cpmk', CpmkController.getFormPemetaanCpmk);

// [4] Detail RPS - lihat saja
router.get('/mata-kuliah/:mataKuliahId/detail-rps', RpsController.getFormDetailRps);

// [5] Rencana Pembelajaran - lihat saja
router.get('/mata-kuliah/:mataKuliahId/rencana-pembelajaran', RpsController.getRencanaPembelajaran);

// [6] Rencana Evaluasi - lihat saja (ini acuan saat input nilai)
router.get('/mata-kuliah/:mataKuliahId/rencana-evaluasi', RpsController.getRencanaEvaluasi);

// ============================================================
// SIDEBAR KELAS KULIAH (yang OBE)
// Dosen HANYA bisa akses kelas yang DIA ampu
// ============================================================

// [Detail Kelas]
router.get('/kelas', KelasKuliahController.findAll);
router.get('/kelas/:id', cekKepemilikanKelas, KelasKuliahController.findOne);

// [Peserta Kelas]
router.get('/kelas/:id/peserta-kelas', cekKepemilikanKelas, KelasKuliahController.classParticipant);

// [Nilai Perkuliahan]
// GET: lihat nilai + komposisi evaluasi
router.get('/kelas/:kelasId/nilai', cekKepemilikanKelas, PenilaianController.getPesertaKelas);
// POST: INPUT NILAI per komponen evaluasi (Tugas/UTS/UAS)
// Body: { nilai: [{ komposisiId, skor }] }
router.post('/kelas/:kelasId/nilai/:krsId', cekKepemilikanKelas, PenilaianController.simpanNilaiMahasiswa);

// POST: INPUT NILAI per CPMK langsung (OBE Langsung)
// Body: { nilaiCpmk: [{ cpmkId, nilai }] }
// nilaiAkhir = Σ(nilaiCPMK × bobotCPMK). Jika ada CPMK < target → otomatis E
router.post('/kelas/:kelasId/nilai-cpmk/:krsId', cekKepemilikanKelas, PenilaianController.simpanNilaiPerCpmk);
// PATCH: KUNCI / BUKA KUNCI NILAI
// Body: { action: 'kunci' | 'buka' }
router.patch('/kelas/:kelasId/nilai/kunci', cekKepemilikanKelas, PenilaianController.kunciNilaiKelas);
router.patch('/kelas/:kelasId/nilai/:rincianKrsId/kunci', cekKepemilikanKelas, PenilaianController.kunciNilaiMahasiswa);

// GET: rincian nilai mentah per komponen (UTS/UAS/Tugas dst) x Sub-CPMK untuk 1 mahasiswa
// -- bukti nilai yang diinput dosen per Sub-CPMK, bukan cuma hasil akhirnya
router.get('/kelas/:kelasId/nilai/:rincianKrsId/rincian', cekKepemilikanKelas, PenilaianController.getRincianNilaiMahasiswa);

// [Capaian Pembelajaran] - tab CPMK dan tab CPL
// ?tab=cpmk -> tabel nilai CPMK per mahasiswa
// ?tab=cpl  -> tabel nilai CPL per mahasiswa (setelah nilai dikunci)
router.get('/kelas/:kelasId/capaian', cekKepemilikanKelas, CapaianController.getCapaianPembelajaran);
router.get('/kelas/:kelasId/capaian/cpmk', cekKepemilikanKelas, CapaianController.getCapaianCpmk);
router.get('/kelas/:kelasId/capaian/cpl', cekKepemilikanKelas, CapaianController.getCapaianCpl);

// [RPS dari Kelas] - lihat saja
router.get('/kelas/:kelasId/rps', cekKepemilikanKelas, CapaianController.getRpsFromKelas);

// Rapor OBE per mahasiswa
router.get('/kelas/:krsId/rapor-obe', cekKepemilikanKelas, PenilaianController.getRaporOBE);
router.get('/kelas/:krsId/rapor-obe/export', cekKepemilikanKelas, async (req, res, next) => {
    if (req.query.format === 'pdf') return exportExcelCapaianKelas.exportPdfRaporObe(req, res, next);
    return exportExcelCapaianKelas.exportExcelRaporObe(req, res, next);
});
router.get('/kelas/:kelasId/nilai/export', cekKepemilikanKelas, async (req, res, next) => {
    if (req.query.format === 'pdf') {
        if (req.query.jenis === 'daftar-nilai') {
            return exportExcelCapaianKelas.exportPdfDaftarNilai(req, res, next);
        }
        return exportExcelCapaianKelas.exportPdfNilaiKelas(req, res, next);
    }
    return exportExcelCapaianKelas.exportExcelNilaiKelas(req, res, next);
});
router.get('/kelas/:kelasId/capaian/export', cekKepemilikanKelas, async (req, res, next) => {
    if (req.query.format === 'pdf') {
        if (req.query.jenis === 'cpl') return exportExcelCapaianKelas.exportPdfCapaianCplKelas(req, res, next);
        return exportExcelCapaianKelas.exportPdfCapaianKelas(req, res, next);
    }
    if (req.query.jenis === 'cpl') return exportExcelCapaianKelas.exportExcelCapaianCplKelas(req, res, next);
    return exportExcelCapaianKelas.exportExcelCapaianKelas(req, res, next);
});

router.get("/kelas/:kelasId/laporan/perkuliahan", cekKepemilikanKelas, PenilaianController.getLaporanPerkuliahan);
router.get("/kelas/:kelasId/laporan/perkuliahan/export", cekKepemilikanKelas, exportExcelCapaianKelas.exportPdfLaporanPerkuliahan);
router.get("/kelas/:kelasId/laporan/daftar-nilai", cekKepemilikanKelas, PenilaianController.getLaporanDaftarNilai);
router.get("/kelas/:kelasId/laporan/daftar-nilai/export", cekKepemilikanKelas, exportExcelCapaianKelas.exportPdfLaporanDaftarNilai);

export default router;