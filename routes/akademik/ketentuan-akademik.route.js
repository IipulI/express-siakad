import express from 'express';
import * as KetentuanController from '../../controllers/akademik/ketentuan-akademik.controller.js';

const router = express.Router();

// ==========================================
// RUTE SKALA NILAI
// ==========================================
// GET: Ambil daftar skala nilai berdasarkan programStudiId & tahunKurikulumId
router.get('/skala-nilai', KetentuanController.fetchSkalaNilai);

// POST: Tambah baru ATAU Update (Upsert) data skala nilai
router.post('/skala-nilai', KetentuanController.upsertSkalaNilai);

// DELETE: Hapus data skala nilai berdasarkan ID
router.delete('/skala-nilai/:id', KetentuanController.destroySkalaNilai);


// ==========================================
// RUTE BATAS SKS
// ==========================================
// GET: Ambil daftar batas SKS berdasarkan jenjangId
router.get('/batas-sks', KetentuanController.fetchBatasSks);

// POST: Tambah baru ATAU Update (Upsert) data batas SKS
router.post('/batas-sks', KetentuanController.upsertBatasSks);

// DELETE: Hapus data batas SKS berdasarkan ID
router.delete('/batas-sks/:id', KetentuanController.destroyBatasSks);

export default router;