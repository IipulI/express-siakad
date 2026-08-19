import express from 'express';
import * as PenilaianController from '../../controllers/akademik/penilaian.controller.js';
import * as KelasKuliahController from '../../controllers/akademik/kelas-kuliah.controller.js';
import * as CapaianController from '../../controllers/akademik/capaian-pembelajaran.controller.js';
import * as ExportNilaiKelasController from '../../controllers/akademik/export-nilai-kelas.controller.js';
import { requireKaprodi } from '../../middleware/require-koordinator-mk.middleware.js';

// FIX 2026-08-19: requireKaprodi sebelumnya CUMA placeholder (`next()` doang,
// gak ada pengecekan apapun) -- siapa aja yang login bisa akses SEMUA endpoint
// di router ini buat kelas kuliah MANAPUN, termasuk Reset Nilai dan Finalisasi
// yang destruktif/gak bisa dibatalin. Sekarang beneran ngecek lewat
// requireKaprodi di middleware bersama (dosen itu harus kaprodi_id dari
// program studi pemilik kelasnya, atau admin akademik).

const router = express.Router();
router.use(requireKaprodi);

// ============================================================
// MONITORING KELAS KULIAH
// ============================================================

// [Detail Kelas]
router.get('/kelas/:id', KelasKuliahController.findOne);

// [Peserta Kelas]
router.get('/kelas/:id/peserta-kelas', KelasKuliahController.classParticipant);

// [Nilai Perkuliahan] - Kaprodi lihat nilai seluruh kelas di prodinya
router.get('/kelas/:kelasId/nilai', PenilaianController.getPesertaKelas);

// ============================================================
// KUNCI NILAI - Hak eksklusif Kaprodi (setara Admin Akademik)
// Sesuai alur SEVIMA: kunci/buka kunci nilai oleh admin level
// Body: { action: 'kunci' | 'buka' }
// ============================================================
router.patch('/kelas/:kelasId/nilai/kunci', PenilaianController.kunciNilaiKelas);
router.patch('/kelas/:kelasId/nilai/:rincianKrsId/kunci', PenilaianController.kunciNilaiMahasiswa);

// ============================================================
// FINALISASI NILAI - Permanent lock setelah masa sanggah habis
// Semua nilai harus dikunci dulu sebelum finalisasi
// Setelah finalisasi: status → 'Lulus' / 'Tidak Lulus' (tidak bisa dibuka)
// ============================================================
router.patch('/kelas/:kelasId/nilai/finalisasi', PenilaianController.finalisasiNilaiKelas);

// ============================================================
// CAPAIAN PEMBELAJARAN
// ============================================================
router.get('/kelas/:kelasId/capaian', CapaianController.getCapaianPembelajaran);
router.get('/kelas/:kelasId/capaian/cpmk', CapaianController.getCapaianCpmk);
router.get('/kelas/:kelasId/capaian/cpl', CapaianController.getCapaianCpl);

// ============================================================
// EXPORT & LAPORAN
// ============================================================
router.get('/kelas/:kelasId/nilai/export', async (req, res, next) => {
    if (req.query.format === 'pdf') return ExportNilaiKelasController.exportPdfNilaiKelas(req, res, next);
    return ExportNilaiKelasController.exportExcelNilaiKelas(req, res, next);
});

router.get('/kelas/:kelasId/capaian/export', async (req, res, next) => {
    if (req.query.format === 'pdf') {
        if (req.query.jenis === 'cpl') return ExportNilaiKelasController.exportPdfCapaianCplKelas(req, res, next);
        return ExportNilaiKelasController.exportPdfCapaianKelas(req, res, next);
    }
    if (req.query.jenis === 'cpl') return ExportNilaiKelasController.exportExcelCapaianCplKelas(req, res, next);
    return ExportNilaiKelasController.exportExcelCapaianKelas(req, res, next);
});

router.get('/kelas/:krsId/rapor-obe', PenilaianController.getRaporOBE);
router.get('/kelas/:krsId/rapor-obe/export', async (req, res, next) => {
    if (req.query.format === 'pdf') return ExportNilaiKelasController.exportPdfRaporObe(req, res, next);
    return ExportNilaiKelasController.exportExcelRaporObe(req, res, next);
});

// ============================================================
// RESET DATA (DEV/TESTING ONLY)
// ============================================================
router.patch('/kelas/:kelasId/nilai/reset-finalisasi', PenilaianController.resetFinalisasiKelas);
router.delete('/kelas/:kelasId/nilai/:rincianKrsId/reset', PenilaianController.resetNilaiMahasiswa);
router.delete('/kelas/:kelasId/nilai/reset-semua', PenilaianController.resetNilaiKelas);
router.post('/kelas/:kelasId/nilai/reset-beberapa', PenilaianController.resetNilaiBeberapa); // body: { rincianKrsIds: [...] }

export default router;
