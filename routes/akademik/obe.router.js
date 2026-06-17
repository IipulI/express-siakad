import { Router } from "express";
import { validateManajemenCapaian,validateStoreProfilLulusan, validateUpdateProfilLulusan,
    validateStoreIK, validateSaveMatriksPlCpl, validateSaveMatriksCplMk} from "../../validators/obe.validator.js";
import { uploadExcel } from '../../utils/upload-file.js';

// Dashboard Utama

// Import semua controller yang terlibat
import * as ObeController from '../../controllers/akademik/obe.controller.js';
import * as PenilaianController from '../../controllers/akademik/penilaian.controller.js';
import * as MonitoringController from '../../controllers/akademik/monitoring.controller.js';
import * as MataKuliahController from '../../controllers/akademik/mata-kuliah.controller.js';
import * as CpmkController from '../../controllers/akademik/cpmk.controller.js';
import * as ExportController from '../../controllers/akademik/export.controller.js';
import { 
    validateCreateMkObe, 
    validateUpdateMkObe, 
    validateDeleteMkObe,
    validateSaveCplMapping
} from "../../validators/mata-kuliah.validator.js";

import { validateSaveCpmk } from "../../validators/cpmk.validator.js";

const router = new Router();

// =====================================================================
// 1. MASTER DATA (Referensi PDF Hal 15 - Dropdown)
// =====================================================================
router.get('/master/dropdown-evaluasi', PenilaianController.getDropdownMasterEvaluasi);


// =====================================================================
// 2. MANAJEMEN CAPAIAN (Bawaan Sistem Lama)
// =====================================================================
// A. Profil Lulusan (PL)
// router.get('/:obeId/profil-lulusan', ObeController.getProfilLulusan);
// router.post('/:obeId/profil-lulusan', ObeController.createProfilLulusan);
// router.put('/:obeId/profil-lulusan/:plId', ObeController.updateProfilLulusan);
// router.delete('/:obeId/profil-lulusan/:plId', ObeController.deleteProfilLulusan);

// B. Capaian Pembelajaran Lulusan (CPL)
router.get('/:obeId/capaian-pembelajaran', ObeController.getCapaianPembelajaranLulusan);
router.post('/:obeId/capaian-pembelajaran', ObeController.createCapaianPembelajaranLulusan);
router.put('/:obeId/capaian-pembelajaran/:cplId', ObeController.updateCapaianPembelajaraanLulusan);
router.delete('/:obeId/capaian-pembelajaran/:cplId', ObeController.deleteCapaianPembelajaranLulusan);

// C. Pemetaan PL -> CPL 
router.post('/:obeId/pemetaan/pl-ke-cpl', ObeController.createPemetaanPlCpl); 

// D. Pemetaan CPL -> Mata Kuliah (CPMK)
router.get('/:obeId/mata-kuliah/:mataKuliahId/capaian-mata-kuliah', ObeController.getCapaianMataKuliah);
router.post('/:obeId/mata-kuliah/:mataKuliahId/capaian-mata-kuliah', ObeController.createCapaianMataKuliah);
router.put('/:obeId/mata-kuliah/:mataKuliahId/capaian-mata-kuliah/:cpmkId', ObeController.updateCapaianMataKuliah);
router.delete('/:obeId/mata-kuliah/:mataKuliahId/capaian-mata-kuliah/:cpmkId', ObeController.deleteCapaianMataKuliah);

// =====================================================================
// 3. MANAJEMEN RPS & KOMPONEN EVALUASI (Referensi PDF Hal 6 - 8)
// =====================================================================
// =====================================================================
// 4. TEMPLATE EVALUASI (Referensi PDF Hal 14)
// =====================================================================
// FIX: Memastikan memanggil fungsi getDaftarTemplate yang ada di PenilaianController
router.get('/template-evaluasi', PenilaianController.getDaftarTemplate);


// =====================================================================
// 5. TRANSAKSI PENILAIAN MAHASISWA (Dinamis)
// =====================================================================
router.post('/krs/:krsId/input-nilai', PenilaianController.simpanNilaiMahasiswa);


// =====================================================================
// 6. MONITORING OBE & LAPORAN (Referensi PDF Hal 10 - 13)
// =====================================================================
router.get('/krs/:krsId/rapor-obe', PenilaianController.getRaporOBE);

// B. Cetak Transkrip OBE Mahasiswa
router.get('/monitoring/transkrip/:mhsId', MonitoringController.getTranskripObeMahasiswa);

// Endpoint "Penyelamat" untuk cek semua ID
router.get('/monitoring/all-ids', MonitoringController.getSemuaDataId);


//GET PESERTA KELAS
router.get('/kelas-kuliah/:kelasId/peserta', PenilaianController.getPesertaKelas);



// =====================================================================
// 0. MANAJEMEN MATA KULIAH OBE (Referensi PDF Hal 1, 3, 4)
// =====================================================================
router.get('/mata-kuliah', MataKuliahController.getDaftarMataKuliahObe);
router.get('/mata-kuliah/:id', MataKuliahController.getDetailMataKuliahObe);

// [TAMBAHAN UNTUK HALAMAN 3 - CREATE, UPDATE, DELETE]
// router.post('/mata-kuliah', MataKuliahController.create);          // Untuk Tombol Simpan (Tambah Baru)
// Rute untuk Create Mata Kuliah OBE
router.post('/mata-kuliah', validateCreateMkObe, MataKuliahController.createMataKuliahObe);
router.put('/mata-kuliah/:id', validateUpdateMkObe, MataKuliahController.updateMataKuliahObe); // 👈 Update
router.delete('/mata-kuliah/:id', validateDeleteMkObe, MataKuliahController.deleteMataKuliahObe); // 👈 Delete
// router.put('/mata-kuliah/:id', MataKuliahController.update);       // Untuk Tombol Simpan (Edit Data)
// router.delete('/mata-kuliah/:id', MataKuliahController.destroy);   // Untuk Tombol Hapus MK



// Endpoint Khusus Matriks Pemetaan
router.get('/:obeId/mata-kuliah/:mataKuliahId/matriks-pemetaan', ObeController.getMatriksPemetaan);


router.get('/mata-kuliah/:id/pemetaan-cpl', MataKuliahController.getCplMapping);


// Endpoint detail mata kuliah biasa
router.get('/mata-kuliah/:id', MataKuliahController.findOne);

// Endpoint untuk merender halaman Ceklis CPL (Yang tadi dibuat)
router.get('/mata-kuliah/:id/pemetaan-cpl', MataKuliahController.getCplMapping);

// Endpoint BARU untuk Tombol "Simpan Data" Pemetaan CPL
router.post('/mata-kuliah/:id/pemetaan-cpl', validateSaveCplMapping, MataKuliahController.saveCplMapping);


router.delete('/mata-kuliah/:id/pemetaan-cpl', MataKuliahController.clearCplMapping);

// ... (route mata kuliah lainnya) ...

// Rute untuk Form Pemetaan CPMK
// router.get('/mata-kuliah/:id/pemetaan-cpmk', CpmkController.getFormPemetaanCpmk);
// router.post('/mata-kuliah/:id/pemetaan-cpmk', CpmkController.savePemetaanCpmk);
router.get('/mata-kuliah/:id/pemetaan-cpmk', CpmkController.getFormPemetaanCpmk);
router.post('/mata-kuliah/:id/pemetaan-cpmk', validateSaveCpmk, CpmkController.savePemetaanCpmk);



// Route untuk Halaman Dashboard Manajemen Capaian
router.get("/manajemen-capaian", validateManajemenCapaian, ObeController.getManajemenCapaian);
// 1. Get List & Header (Format: /api/akademik/obe/profil-lulusan/ID_OBE)
// router.get('/profil-lulusan/:obeId', ObeController.getProfilLulusan);

// // 2. Simpan PL Baru (Body: siakObeId, kode, profil, profesi, deskripsi)
// router.post('/profil-lulusan', ObeController.storeProfilLulusan);

// // 3. Update PL (Format: /api/akademik/obe/profil-lulusan/ID_PL)
// router.put('/profil-lulusan/:id', ObeController.updateProfilLulusan);

// // 4. Delete PL (Format: /api/akademik/obe/profil-lulusan/ID_PL)
// router.delete('/profil-lulusan/:id', ObeController.destroyProfilLulusan);

router.get('/profil-lulusan/:obeId', ObeController.getProfilLulusan);
router.get('/profil-lulusan/:obeId/opsi-salin', ObeController.getOpsiSalinPL);
router.post('/profil-lulusan/:obeId/salin', ObeController.salinDataPL);
router.get('/profil-lulusan/:obeId/template', ObeController.downloadTemplatePL);
router.get('/profil-lulusan/:obeId/export', ObeController.exportDataPL);
router.post('/profil-lulusan/:obeId/import', uploadExcel.single('file'), ObeController.importDataPL);

// 2. POST Simpan Data
router.post('/profil-lulusan', validateStoreProfilLulusan, ObeController.storeProfilLulusan);

// 3. PUT Update Data
router.put('/profil-lulusan/:id', validateUpdateProfilLulusan, ObeController.updateProfilLulusan);

// 4. DELETE Hapus Data
router.delete('/profil-lulusan/:id', ObeController.destroyProfilLulusan);

// --- B. Capaian Pembelajaran Lulusan (CPL) ---
// =====================================================================
// B. Capaian Pembelajaran Lulusan (CPL)
// =====================================================================

// 1. GET (Tembak ID OBE)
router.get('/capaian-pembelajaran/:obeId', ObeController.getCapaianPembelajaranLulusan);
router.post('/capaian-pembelajaran/:obeId/ambil-cpl-umum', ObeController.ambilCplUmum);
router.get('/capaian-pembelajaran/:obeId/opsi-salin', ObeController.getOpsiSalinCPL);
router.post('/capaian-pembelajaran/:obeId/salin', ObeController.salinDataCPL);
router.get('/capaian-pembelajaran/:obeId/template', ObeController.downloadTemplateCPL);
router.get('/capaian-pembelajaran/:obeId/export', ObeController.exportDataCPL);
router.post('/capaian-pembelajaran/:obeId/import', uploadExcel.single('file'), ObeController.importDataCPL);

// 2. POST (Tembak ID OBE) -> INI YANG TADI ERROR CANNOT POST
router.post('/capaian-pembelajaran/:obeId', ObeController.createCapaianPembelajaranLulusan);

// 3. PUT (Tembak ID CPL)
router.put('/capaian-pembelajaran/:cplId', ObeController.updateCapaianPembelajaraanLulusan);

// 3b. PATCH - Update target CPL saja (Kaprodi/Admin)
router.patch('/capaian-pembelajaran/:cplId/target', ObeController.updateTargetCpl);

// 4. DELETE (Tembak ID CPL)
router.delete('/capaian-pembelajaran/:cplId', ObeController.deleteCapaianPembelajaranLulusan);
router.post('/indikator-kinerja', validateStoreIK, ObeController.storeIndikatorKinerja);
router.put('/indikator-kinerja/:id', ObeController.updateIndikatorKinerja);
router.delete('/indikator-kinerja/:id', ObeController.destroyIndikatorKinerja);

// =====================================================================
// C. Pemetaan PL -> CPL (Matriks Bobot)
// =====================================================================

// // 1. GET: Ambil struktur matriks (Header, Daftar PL, Daftar CPL, dan Data Bobot)
// router.get('/pemetaan/pl-ke-cpl/:obeId', ObeController.getMatriksPemetaanPlCpl);

// // 2. POST: Simpan data matriks secara massal (Wipe & Replace)
// router.post('/pemetaan/pl-ke-cpl/:obeId', ObeController.createPemetaanPlCpl);
// GET Struktur Matriks
router.get('/pemetaan/pl-ke-cpl/:obeId', ObeController.getMatriksPemetaanPlCpl);
router.get('/pemetaan/pl-ke-cpl/:obeId/opsi-salin', ObeController.getOpsiSalinPemetaanPlCpl);
router.get('/pemetaan/pl-ke-cpl/:obeId/pratinjau-salin', ObeController.pratinjauSalinPemetaanPlCpl);
router.post('/pemetaan/pl-ke-cpl/:obeId/salin', ObeController.salinPemetaanPlCpl);

// POST Simpan Matriks (Bulk)
router.post('/pemetaan/pl-ke-cpl/:obeId', validateSaveMatriksPlCpl, ObeController.createPemetaanPlCpl);

// D. Pemetaan CPL -> MK
// router.get('/pemetaan/cpl-ke-mk/:obeId', ObeController.getMatriksPemetaanCplMk);
router.get(
    '/pemetaan/cpl-ke-mk/:obeId', 
    ObeController.getMatriksPemetaanCplMk
);
// router.post('/pemetaan/cpl-ke-mk/:obeId', ObeController.savePemetaanCplMk);
router.post(
    '/pemetaan/cpl-ke-mk/:obeId', 
    validateSaveMatriksCplMk, // Menggunakan validator yang kita buat tadi
    ObeController.savePemetaanCplMk
);

// =====================================================================
// 7. CETAK LAPORAN OBE (Referensi PDF Hal Akhir)
// =====================================================================
// Method GET: Tembak ID OBE untuk mendapatkan seluruh data laporan
router.get('/laporan/:obeId', ObeController.getCetakLaporanObe);


router.get('/export/excel/matriks-pl-cpl/:obeId', ExportController.exportExcelMatriksPlCpl);
router.get('/export/pdf/pemetaan-cpl-mk/:obeId', ExportController.exportPdfPemetaanCplMk);
router.get('/export/pdf/laporan-lengkap', ExportController.exportPdfLaporanLengkap);

router.get('/export/pdf/monitoring-cpl-prodi', ExportController.exportPdfMonitoringCplProdi);


// ROUTE JSON - CPL per Mahasiswa (Daftar Kelas)
router.get('/monitoring/cpl-mahasiswa', MonitoringController.getLaporanCplPerMahasiswa);

// ROUTE PDF - CPL per Mahasiswa (Daftar Kelas)
router.get('/export/pdf/monitoring-cpl-mahasiswa', ExportController.exportPdfLaporanCplPerMahasiswa);

// ROUTE JSON - Monitoring CPL per Mata Kuliah (Untuk Postman / Frontend)
router.get('/monitoring/cpl-mata-kuliah', MonitoringController.getLaporanCplPerMataKuliah);

// ROUTE PDF - Export Monitoring CPL per Mata Kuliah
router.get('/export/pdf/monitoring-cpl-mata-kuliah', ExportController.exportPdfLaporanCplPerMataKuliah);

router.get('/monitoring/mk-mahasiswa', MonitoringController.getLaporanMkPerMahasiswa);
router.get('/export/pdf/monitoring-mk-mahasiswa', ExportController.exportPdfLaporanMkPerMahasiswa);
router.get('/monitoring/transkrip-obe', MonitoringController.getTranskripObeMahasiswas);
router.get('/export/pdf/transkrip-obe', ExportController.exportPdfTranskripObeMahasiswa);

router.get('/monitoring/cpmk-mahasiswa', MonitoringController.getLaporanCpmkPerMahasiswa);
router.get('/export/pdf/monitoring-cpmk-mahasiswa', ExportController.exportPdfLaporanCpmkPerMahasiswa);
router.get('/monitoring/cpl-prodi', MonitoringController.getMonitoringCplProdi);
export default router;
