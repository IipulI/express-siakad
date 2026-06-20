import express from 'express';
import * as MkKurikulumController from '../../controllers/akademik/mata-kuliah-kurikulum.controller.js';
import * as RpsController from '../../controllers/akademik/rps.controller.js';
import * as ExportController from '../../controllers/akademik/export.controller.js';
import {
    validateGetRekapSks, validateAssignMk, validateUpdateMk, validateIdParam,
    validateGetPratinjauSalinMataKuliahKurikulum, validateSalinMataKuliahKurikulum,
    validateGetRpsGabungan
} from '../../validators/mata-kuliah-kurikulum.validator.js';

const router = express.Router();

// // --- READ (Yang sudah kita buat sebelumnya) ---
// router.get('/rekap-sks', MkKurikulumController.fetchRekapDistribusiSks);
// router.get('/per-semester', MkKurikulumController.fetchMataKuliahPerSemester);

// // Route untuk mengisi Dropdown form Prasyarat
// router.get('/dropdown-prasyarat', MkKurikulumController.fetchDropdownPrasyarat);
// // Dropdown untuk opsi "Pilih Konsentrasi" di form Konsentrasi
// router.get('/dropdown-konsentrasi', MkKurikulumController.fetchDropdownKonsentrasi);

// router.get('/:id', MkKurikulumController.fetchDetailMataKuliah);

// // --- CREATE, UPDATE, DELETE (Baru) ---
// // POST: Untuk tombol "+ Tambah" di Gambar 1
// router.post('/assign', MkKurikulumController.addMataKuliahKeKurikulum);



// // PUT: Untuk tombol "Ubah Data" di Gambar 2
// router.put('/:id', MkKurikulumController.updateDetailMataKuliah);

// // DELETE: Untuk tombol "Hapus" (Tong Sampah) di Gambar 1 & Gambar 2
// router.delete('/:id', MkKurikulumController.deleteMataKuliahKurikulum);
router.get('/rekap-sks', validateGetRekapSks, MkKurikulumController.fetchRekapDistribusiSks);
router.get('/per-semester', MkKurikulumController.fetchMataKuliahPerSemester); // Bisa tambah validator query juga nanti
router.get('/dropdown-prasyarat', MkKurikulumController.fetchDropdownPrasyarat);
router.get('/dropdown-konsentrasi', MkKurikulumController.fetchDropdownKonsentrasi);

// SALIN DATA -- harus ditaruh SEBELUM "/:id" supaya tidak ketangkap jadi param :id
router.get('/pratinjau-salin', validateGetPratinjauSalinMataKuliahKurikulum, MkKurikulumController.fetchPratinjauSalinMataKuliahKurikulum);
router.post('/salin', validateSalinMataKuliahKurikulum, MkKurikulumController.postSalinMataKuliahKurikulum);

// RPS GABUNGAN -- pratinjau (JSON) & cetak PDF semua Mata Kuliah dalam 1 Prodi +
// Tahun Kurikulum sekaligus (digabung jadi 1 dokumen, seperti Laporan Silabus)
router.get('/rps/pratinjau', validateGetRpsGabungan, RpsController.getLaporanRpsGabunganProdi);
router.get('/rps/cetak/pdf', validateGetRpsGabungan, ExportController.exportPdfLaporanRpsGabungan);

router.get('/:id', validateIdParam, MkKurikulumController.fetchDetailMataKuliah);

// --- CREATE, UPDATE, DELETE ---
router.post('/assign', validateAssignMk, MkKurikulumController.addMataKuliahKeKurikulum);
router.put('/:id', validateUpdateMk, MkKurikulumController.updateDetailMataKuliah);
router.delete('/:id', validateIdParam, MkKurikulumController.deleteMataKuliahKurikulum);


export default router;