import { Router } from "express";
import * as RpsController from "../../controllers/akademik/rps.controller.js";
import { normalizeFilePath, upload } from "../../utils/upload-file.js";
import { 
    validateSaveDetailRps, 
    validateSaveSesiPembelajaran, 
    validateSaveEvaluasi,
    validateSaveSesi,
    validateSaveEvaluasiList
} from "../../validators/rps.validator.js"; 
const router = new Router();


// ==========================================
// RUTE DETAIL RPS (HALAMAN 6 UI)
// ==========================================
// Jika frontend ingin load data periode tertentu (fitur salin data):
// GET /api/rps/mata-kuliah/:mataKuliahId/detail?periodeId=id_periode
router.get('/mata-kuliah/:mataKuliahId/detail', RpsController.getFormDetailRps);

// Create / Update (Berdasarkan Mata Kuliah & Periode Akademik di payload)
// router.post(
//     '/mata-kuliah/:mataKuliahId/detail',
//     upload.single("dokumenRps"),
//     normalizeFilePath,
//     RpsController.saveDetailRps
// );
router.post(
    '/mata-kuliah/:mataKuliahId/detail',
    upload.single("dokumenRps"),
    normalizeFilePath,
    validateSaveDetailRps, // 👈 Pasang Validator
    RpsController.saveDetailRps
);
router.delete('/detail/:id', RpsController.deleteDetailRps);


// ==========================================
// RUTE RENCANA PEMBELAJARAN (HALAMAN 7 UI)
// ==========================================
router.get('/mata-kuliah/:mataKuliahId/rencana-pembelajaran', RpsController.getRencanaPembelajaran);
// router.post('/mata-kuliah/:mataKuliahId/rencana-pembelajaran', RpsController.createRencanaPembelajaran);

// router.post(
//     '/mata-kuliah/:mataKuliahId/rencana-pembelajaran', 
//     validateSaveSesiPembelajaran, 
//     RpsController.createRencanaPembelajaran
// );
// router.put('/rencana-pembelajaran/:id', RpsController.updateRencanaPembelajaran);
// router.delete('/rencana-pembelajaran/:id', RpsController.deleteRencanaPembelajaran);
router.post('/mata-kuliah/:mataKuliahId/rencana-pembelajaran', validateSaveSesi, RpsController.createRencanaPembelajaran);

// PUT: Update Sesi (pake ID Sesi langsung)
router.put('/rencana-pembelajaran/:id', RpsController.updateRencanaPembelajaran);

// DELETE: Hapus Sesi
router.delete('/rencana-pembelajaran/:id', RpsController.deleteRencanaPembelajaran);


// ==========================================
// RUTE RENCANA EVALUASI (HALAMAN 8 UI)
// ==========================================
// router.get('/mata-kuliah/:mataKuliahId/rencana-evaluasi', RpsController.getRencanaEvaluasi);
// router.post('/mata-kuliah/:mataKuliahId/rencana-evaluasi', RpsController.createRencanaEvaluasi);
// router.put('/rencana-evaluasi/:id', RpsController.updateRencanaEvaluasi);
// router.delete('/rencana-evaluasi/:id', RpsController.deleteRencanaEvaluasi);
// ✅ Pastikan nama fungsinya RpsController.getRencanaEvaluasi
router.get('/mata-kuliah/:mataKuliahId/rencana-evaluasi', RpsController.getRencanaEvaluasi);
router.post('/mata-kuliah/:mataKuliahId/rencana-evaluasi', validateSaveEvaluasiList, RpsController.saveRencanaEvaluasiList);

// ✅ Tambahkan rute DELETE kalau belum ada
router.delete('/rencana-evaluasi/:id', RpsController.deleteRencanaEvaluasi);
export default router;