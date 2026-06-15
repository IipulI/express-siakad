import express from 'express';
import * as MataKuliahController from '../../controllers/akademik/mata-kuliah.controller.js';
import * as CpmkController from '../../controllers/akademik/cpmk.controller.js';
import * as RpsController from '../../controllers/akademik/rps.controller.js';
import * as PenilaianController from '../../controllers/akademik/penilaian.controller.js';
import * as KelasKuliahController from '../../controllers/akademik/kelas-kuliah.controller.js';
import * as CapaianController from '../../controllers/akademik/capaian-pembelajaran.controller.js';
import * as ExportNilaiKelasController from '../../controllers/akademik/export-nilai-kelas.controller.js';
import { normalizeFilePath, upload } from '../../utils/upload-file.js';

/**
 * MIDDLEWARE PLACEHOLDER - KOORDINATOR MK
 * TODO: diisi tim SSO/RBAC dengan JWT verify
 * decoded.role === 'koordinator_mk'
 * req.dosenId = decoded.dosenId
 */
const requireKoordinatorMK = (req, res, next) => {
    // TODO: JWT verify oleh tim SSO
    next();
};

const router = express.Router();
router.use(requireKoordinatorMK);

// ============================================================
// SIDEBAR MATA KULIAH
// ============================================================

// [1] Data Mata Kuliah
router.get('/mata-kuliah', MataKuliahController.getDaftarMataKuliahObe);
router.get('/mata-kuliah/:id', MataKuliahController.getDetailMataKuliahObe);

// [2] Pemetaan CPL
router.get('/mata-kuliah/:id/pemetaan-cpl', MataKuliahController.getCplMapping);
router.post('/mata-kuliah/:id/pemetaan-cpl', MataKuliahController.saveCplMapping);

// [3] Pemetaan CPMK
router.get('/mata-kuliah/:id/pemetaan-cpmk', CpmkController.getFormPemetaanCpmk);
router.post('/mata-kuliah/:id/pemetaan-cpmk', CpmkController.savePemetaanCpmk);

// [4] Detail RPS
router.get('/mata-kuliah/:mataKuliahId/detail-rps', RpsController.getFormDetailRps);
router.post('/mata-kuliah/:mataKuliahId/detail-rps',
    upload.single('dokumenRps'), normalizeFilePath, RpsController.saveDetailRps);
router.delete('/detail-rps/:id', RpsController.deleteDetailRps);

// [5] Rencana Pembelajaran
router.get('/mata-kuliah/:mataKuliahId/rencana-pembelajaran', RpsController.getRencanaPembelajaran);
router.post('/mata-kuliah/:mataKuliahId/rencana-pembelajaran', RpsController.createRencanaPembelajaran);
router.put('/rencana-pembelajaran/:id', RpsController.updateRencanaPembelajaran);
router.delete('/rencana-pembelajaran/:id', RpsController.deleteRencanaPembelajaran);

// [6] Rencana Evaluasi
router.get('/mata-kuliah/:mataKuliahId/rencana-evaluasi', RpsController.getRencanaEvaluasi);
router.post('/mata-kuliah/:mataKuliahId/rencana-evaluasi', RpsController.saveRencanaEvaluasiList);
router.delete('/rencana-evaluasi/:id', RpsController.deleteRencanaEvaluasi);

// Komposisi Nilai Kelas (setup mapping komponen → CPMK + bobot)
router.get('/mata-kuliah/:mataKuliahId/komposisi-nilai', PenilaianController.getKomposisiRPS);
router.post('/mata-kuliah/:mataKuliahId/komposisi-nilai', PenilaianController.setupKomposisiRPS);

// ============================================================
// SIDEBAR KELAS KULIAH (yang OBE)
// ============================================================

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