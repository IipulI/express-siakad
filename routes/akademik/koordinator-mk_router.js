import express from 'express';
import models from '../../models/index.js';
import * as MataKuliahController from '../../controllers/akademik/mata-kuliah.controller.js';
import * as CpmkController from '../../controllers/akademik/cpmk.controller.js';
import * as RpsController from '../../controllers/akademik/rps.controller.js';
import * as PenilaianController from '../../controllers/akademik/penilaian.controller.js';
import * as KelasKuliahController from '../../controllers/akademik/kelas-kuliah.controller.js';
import * as CapaianController from '../../controllers/akademik/capaian-pembelajaran.controller.js';
import * as ExportNilaiKelasController from '../../controllers/akademik/export-nilai-kelas.controller.js';
import * as ExportController from '../../controllers/akademik/export.controller.js';
import { normalizeFilePath, upload, uploadExcel } from '../../utils/upload-file.js';
import { validateSaveDetailRps, validateGetPratinjauSalinDetailRps, validateSalinDetailRps } from '../../validators/rps.validator.js';
import { requireKoordinatorMK, requireDosenLogin } from '../../middleware/require-koordinator-mk.middleware.js';

const { Rps, RencanaPembelajaran, RencanaEvaluasi } = models;

// FIX 2026-08-19: middleware ini sebelumnya CUMA placeholder (`next()` doang,
// gak ada pengecekan apapun) -- artinya siapa aja yang login (mahasiswa, dosen
// biasa, dst) bisa lewat sini dan ubah CPL/CPMK/RPS/Rencana Pembelajaran/
// Rencana Evaluasi mata kuliah MANAPUN, bukan cuma yang dia koordinatori.
// Sekarang beneran ngecek: req.user.dosen.id (di-set attachUser.middleware.js
// dari token, baik login SSO maupun login langsung -- dua-duanya lewat
// attachUser yang sama) harus SAMA PERSIS dengan koordinator_mk_id mata kuliah
// yang dituju. Pengecualian: role AKADEMIK_UNIV (admin akademik) selalu boleh
// lewat, gak peduli koordinator atau bukan -- sesuai arahan, admin harus tetap
// bisa akses endpoint ini juga (bukan cuma lewat /akademik/obe/...).
// Logic-nya sekarang dipindah ke middleware/require-koordinator-mk.middleware.js
// biar bisa dipakai bareng sama obe.router.js (endpoint pemetaan-cpmk lama di
// sana punya celah yang sama).

// resolveMataKuliahId: cara ekstrak siak_mata_kuliah_id dari request, beda-beda
// tergantung bentuk route-nya (langsung di params, atau harus nengok dulu ke
// resource turunannya kayak RencanaPembelajaran/:id).
const resolveDariRencanaPembelajaranId = async (req) => {
    const row = await RencanaPembelajaran.findByPk(req.params.id, { attributes: ['siakMataKuliahId'] });
    return row?.siakMataKuliahId || null;
};
const resolveDariRencanaEvaluasiId = async (req) => {
    const row = await RencanaEvaluasi.findByPk(req.params.id, { attributes: ['siakMataKuliahId'] });
    return row?.siakMataKuliahId || null;
};
const resolveDariDetailRpsId = async (req) => {
    const row = await Rps.findByPk(req.params.id, { attributes: ['siakMataKuliahId'] });
    return row?.siakMataKuliahId || null;
};

const router = express.Router();

// ============================================================
// SIDEBAR MATA KULIAH
// ============================================================

// [1] Data Mata Kuliah -- list gak spesifik ke 1 MK, sebatas wajib dosen asli;
//     detail 1 MK harus koordinator MK itu sendiri.
router.get('/mata-kuliah', requireDosenLogin, MataKuliahController.getDaftarMataKuliahObe);
router.get('/mata-kuliah/:id', requireKoordinatorMK(), MataKuliahController.getDetailMataKuliahObe);

// [2] Pemetaan CPL
router.get('/mata-kuliah/:id/pemetaan-cpl', requireKoordinatorMK(), MataKuliahController.getCplMapping);
router.post('/mata-kuliah/:id/pemetaan-cpl', requireKoordinatorMK(), MataKuliahController.saveCplMapping);

// [3] Pemetaan CPMK
router.get('/mata-kuliah/:id/pemetaan-cpmk', requireKoordinatorMK(), CpmkController.getFormPemetaanCpmk);
router.post('/mata-kuliah/:id/pemetaan-cpmk', requireKoordinatorMK(), CpmkController.savePemetaanCpmk);

// [4] Detail RPS
router.get('/mata-kuliah/:mataKuliahId/detail-rps', requireKoordinatorMK(), RpsController.getFormDetailRps);
router.get('/mata-kuliah/:mataKuliahId/detail-rps/pratinjau-salin', requireKoordinatorMK(), validateGetPratinjauSalinDetailRps, RpsController.pratinjauSalinDetailRps);
router.post('/mata-kuliah/:mataKuliahId/detail-rps/salin', requireKoordinatorMK(), validateSalinDetailRps, RpsController.salinDetailRps);
router.post('/mata-kuliah/:mataKuliahId/detail-rps', requireKoordinatorMK(),
    upload.single('dokumenRps'), normalizeFilePath, validateSaveDetailRps, RpsController.saveDetailRps);
router.delete('/detail-rps/:id', requireKoordinatorMK(resolveDariDetailRpsId), RpsController.deleteDetailRps);

// [5] Rencana Pembelajaran
router.get('/mata-kuliah/:mataKuliahId/rencana-pembelajaran', requireKoordinatorMK(), RpsController.getRencanaPembelajaran);
router.get('/mata-kuliah/:mataKuliahId/rencana-pembelajaran/template', requireKoordinatorMK(), RpsController.downloadTemplateRencanaPembelajaran);
router.post('/mata-kuliah/:mataKuliahId/rencana-pembelajaran/import', requireKoordinatorMK(), uploadExcel.single('file'), RpsController.importRencanaPembelajaran);
router.get('/mata-kuliah/:mataKuliahId/rencana-pembelajaran/pratinjau-salin', requireKoordinatorMK(), RpsController.pratinjauSalinRencanaPembelajaran);
router.post('/mata-kuliah/:mataKuliahId/rencana-pembelajaran/salin', requireKoordinatorMK(), RpsController.salinRencanaPembelajaran);
router.post('/mata-kuliah/:mataKuliahId/rencana-pembelajaran', requireKoordinatorMK(), RpsController.createRencanaPembelajaran);
router.get('/rencana-pembelajaran/:id', requireKoordinatorMK(resolveDariRencanaPembelajaranId), RpsController.getDetailRencanaPembelajaran);
router.put('/rencana-pembelajaran/:id', requireKoordinatorMK(resolveDariRencanaPembelajaranId), RpsController.updateRencanaPembelajaran);
router.delete('/rencana-pembelajaran/:id', requireKoordinatorMK(resolveDariRencanaPembelajaranId), RpsController.deleteRencanaPembelajaran);

// [6] Rencana Evaluasi
router.get('/mata-kuliah/:mataKuliahId/rencana-evaluasi', requireKoordinatorMK(), RpsController.getRencanaEvaluasi);
router.post('/mata-kuliah/:mataKuliahId/rencana-evaluasi', requireKoordinatorMK(), RpsController.saveRencanaEvaluasiList);
router.get('/mata-kuliah/:mataKuliahId/rencana-evaluasi/pratinjau-salin', requireKoordinatorMK(), RpsController.pratinjauSalinRencanaEvaluasi);
router.post('/mata-kuliah/:mataKuliahId/rencana-evaluasi/salin', requireKoordinatorMK(), RpsController.salinRencanaEvaluasi);
router.post('/mata-kuliah/:mataKuliahId/rencana-evaluasi/reset', requireKoordinatorMK(), RpsController.resetRencanaEvaluasi);
router.delete('/rencana-evaluasi/:id', requireKoordinatorMK(resolveDariRencanaEvaluasiId), RpsController.deleteRencanaEvaluasi);

// Laporan Cetak RPS Lengkap (Kop + CP + Deskripsi + Rencana Pembelajaran + Rencana Evaluasi)
router.get('/mata-kuliah/:mataKuliahId/rps/cetak', requireKoordinatorMK(), RpsController.getLaporanRpsCetak);
router.get('/mata-kuliah/:mataKuliahId/rps/cetak/pdf', requireKoordinatorMK(), ExportController.exportPdfLaporanRps);

// ============================================================
// SIDEBAR KELAS KULIAH (yang OBE)
// ============================================================
router.use(requireDosenLogin);

// [Detail Kelas]
router.get('/kelas/:id', KelasKuliahController.findOne);

// [Peserta Kelas]
router.get('/kelas/:id/peserta-kelas', KelasKuliahController.classParticipant);

// [Nilai Perkuliahan] - Koordinator lihat nilai semua dosen di MK yang dia koordinatori
router.get('/kelas/:kelasId/nilai', PenilaianController.getPesertaKelas);

router.post('/kelas/:kelasId/nilai-cpmk/:krsId', PenilaianController.simpanNilaiPerCpmk);

// [Export Nilai Kelas] - ?format=pdf -> PDF, default -> Excel
router.get('/kelas/:kelasId/nilai/export', async (req, res, next) => {
    if (req.query.format === 'pdf') return ExportNilaiKelasController.exportPdfNilaiKelas(req, res, next);
    return ExportNilaiKelasController.exportExcelNilaiKelas(req, res, next);
});

// [Export Capaian Kelas] - ?format=pdf -> PDF, default -> Excel ; ?jenis=cpl -> tab CPL
router.get('/kelas/:kelasId/capaian/export', async (req, res, next) => {
    if (req.query.format === 'pdf') {
        if (req.query.jenis === 'cpl') return ExportNilaiKelasController.exportPdfCapaianCplKelas(req, res, next);
        return ExportNilaiKelasController.exportPdfCapaianKelas(req, res, next);
    }
    if (req.query.jenis === 'cpl') return ExportNilaiKelasController.exportExcelCapaianCplKelas(req, res, next);
    return ExportNilaiKelasController.exportExcelCapaianKelas(req, res, next);
});

// [Capaian Pembelajaran] - Tab CPMK dan Tab CPL
// ?tab=cpmk -> tabel nilai CPMK per mahasiswa
// ?tab=cpl  -> tabel nilai CPL per mahasiswa (setelah nilai dikunci)
router.get('/kelas/:kelasId/capaian', CapaianController.getCapaianPembelajaran);
router.get('/kelas/:kelasId/capaian/cpmk', CapaianController.getCapaianCpmk);
router.get('/kelas/:kelasId/capaian/cpl', CapaianController.getCapaianCpl);

// [RPS dari Kelas]
router.get('/kelas/:kelasId/rps', CapaianController.getRpsFromKelas);

// Rapor OBE per mahasiswa
router.get('/kelas/:krsId/rapor-obe', PenilaianController.getRaporOBE);
router.get('/kelas/:krsId/rapor-obe/export', async (req, res, next) => {
    if (req.query.format === 'pdf') return ExportNilaiKelasController.exportPdfRaporObe(req, res, next);
    return ExportNilaiKelasController.exportExcelRaporObe(req, res, next);
});

export default router;