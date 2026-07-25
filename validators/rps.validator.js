// 👇 LIHAT DI SINI: Saya sudah tambahkan 'query' di dalam kurung kurawal
import { body, param, query, validationResult } from "express-validator"; 
import * as CustomError from '../utils/custom-error.js';

// --- Blok Validator yang Abang Minta (Tetap Aman/Tidak Diubah) ---
export const validateCreateRps = [
  body("siakMataKuliahId")
    .notEmpty()
    .withMessage("siakMataKuliahId wajib diisi")
    .isInt()
    .withMessage("siakMataKuliahId harus berupa angka"),

  body("tanggalPenyusunan")
    .notEmpty()
    .withMessage("tanggalPenyusunan wajib diisi")
    .isISO8601()
    .withMessage("tanggalPenyusunan harus berupa tanggal valid (YYYY-MM-DD)"),

  body("deskripsiMataKuliah")
    .notEmpty()
    .withMessage("deskripsiMataKuliah wajib diisi")
    .isString()
    .withMessage("deskripsiMataKuliah harus berupa teks"),

  body("tujuanMataKuliah")
    .notEmpty()
    .withMessage("tujuanMataKuliah wajib diisi")
    .isString()
    .withMessage("tujuanMataKuliah harus berupa teks"),

  body("materiPembelajaran")
    .optional()
    .isString()
    .withMessage("materiPembelajaran harus berupa teks"),

  body("pustakaUtama")
    .optional()
    .isString()
    .withMessage("pustakaUtama harus berupa teks"),

  body("pustakaPendukung")
    .optional()
    .isString()
    .withMessage("pustakaPendukung harus berupa teks"),
];

// --- Helper untuk Eksekusi Validasi ---
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new CustomError.BadRequestError(errors.array()[0].msg);
    }
    next();
};

// --- Halaman 6: Detail RPS ---
export const validateSaveDetailRps = [
    param('mataKuliahId').isUUID().withMessage('ID Mata Kuliah tidak valid'),
    body('siakPeriodeAkademikId').isUUID().withMessage('ID Periode Akademik wajib diisi'),
    body('tanggalPenyusunan').isDate().withMessage('Format tanggal tidak valid (YYYY-MM-DD)'),
    body('deskripsiMataKuliah').notEmpty().withMessage('Deskripsi Mata Kuliah wajib diisi'),
    body('tujuanMataKuliah').notEmpty().withMessage('Tujuan Mata Kuliah wajib diisi'),
    body('materiPembelajaran').notEmpty().withMessage('Materi Pembelajaran wajib diisi'),
    body('pustakaUtama').notEmpty().withMessage('Pustaka Utama wajib diisi'),
    body('pustakaPendukung').notEmpty().withMessage('Pustaka Pendukung wajib diisi'),
    validate
];

// Validator untuk GET Rencana Pembelajaran
export const validateGetRencanaPembelajaran = [
    param('mataKuliahId').isUUID().withMessage('ID Mata Kuliah tidak valid'),
    query('periodeId').optional().isUUID().withMessage('ID Periode tidak valid'),
    validate
];

// Validator untuk POST Tambah Sesi
export const validateSaveSesiPembelajaran = [
    param('mataKuliahId').isUUID().withMessage('ID Mata Kuliah tidak valid'),
    body('siakPeriodeAkademikId').isUUID().withMessage('Periode wajib dipilih'),
    body('sesi').isInt({ min: 1, max: 16 }).withMessage('Sesi harus angka 1-16'),
    body('materiPembelajaran').notEmpty().withMessage('Materi wajib diisi'),
    body('cpmkIds').isArray({ min: 1 }).withMessage('Pilih minimal satu CPMK'),
    validate
];

// --- Halaman 8: Rencana Evaluasi ---
export const validateSaveEvaluasi = [
    param('mataKuliahId').isUUID().withMessage('ID Mata Kuliah tidak valid'),
    body('metodeEvaluasi').notEmpty().withMessage('Metode evaluasi wajib diisi'),
    body('bobotEvaluasi').isFloat({ min: 1, max: 100 }).withMessage('Bobot evaluasi harus 1-100%'),
    body('cpmkData').isArray({ min: 1 }).withMessage('Pemetaan bobot ke CPMK wajib diisi'),
    body('cpmkData.*.cpmkId').isUUID().withMessage('ID CPMK tidak valid'),
    body('cpmkData.*.bobotCpmk').isFloat({ min: 1 }).withMessage('Bobot CPMK wajib diisi'),
    validate
];

export const validateSaveSesi = [
    param('mataKuliahId').isUUID().withMessage('ID Mata Kuliah tidak valid'),
    body('siakPeriodeAkademikId').isUUID().withMessage('Periode Akademik wajib dipilih'),
    body('sesi').isInt({ min: 1, max: 16 }).withMessage('Sesi harus angka 1-16'),
    body('jenisPertemuan').notEmpty().withMessage('Jenis pertemuan wajib dipilih'),
    body('materiPembelajaran').notEmpty().withMessage('Materi Perkuliahan (IND) wajib diisi'),
    body('bobotPenilaian').isFloat({ min: 0, max: 100 }).withMessage('Bobot Penilaian harus 0-100'),
    body('cpmkIds').isArray({ min: 1 }).withMessage('Minimal pilih 1 CPMK/Sub-CPMK dari tabel mapping'),
    body('cpmkIds.*').isUUID().withMessage('ID CPMK tidak valid'),
    validate
];
export const validateUpdateSesi = [
    param('id').isUUID().withMessage('ID Sesi tidak valid'),
    body('siakPeriodeAkademikId').isUUID().withMessage('Periode Akademik wajib dipilih'),
    body('sesi').isInt({ min: 1, max: 16 }).withMessage('Sesi harus angka 1-16'),
    body('jenisPertemuan').notEmpty().withMessage('Jenis pertemuan wajib dipilih'),
    body('materiPembelajaran').notEmpty().withMessage('Materi Perkuliahan (IND) wajib diisi'),
    body('bobotPenilaian').isFloat({ min: 0, max: 100 }).withMessage('Bobot Penilaian harus 0-100'),
    validate
];
export const validateCpmk = [
    param('mataKuliahId').isUUID().withMessage('ID Mata Kuliah tidak valid'),
    body('kode').notEmpty().withMessage('Kode CPMK wajib diisi'),
    body('deskripsi').notEmpty().withMessage('Deskripsi wajib diisi'),
    body('target').optional().isFloat({ min: 0, max: 100 }).withMessage('Target harus 0-100'),
    body('bobot').optional().isFloat({ min: 0, max: 100 }).withMessage('Bobot harus 0-100'),
    // parentId boleh kosong (null) kalau dia mau jadi Parent Utama
    body('parentId').optional({ nullable: true }).isUUID().withMessage('ID Parent tidak valid'),
    validate
];
export const validateSaveEvaluasiList = [
    param('mataKuliahId').isUUID().withMessage('ID Mata Kuliah tidak valid'),
    body('siakPeriodeAkademikId').isUUID().withMessage('Periode Akademik wajib dipilih'),
    body('evaluasiList').isArray({ min: 1 }).withMessage('Minimal harus ada 1 komponen evaluasi'),
    
    // Validasi per baris evaluasi
    body('evaluasiList.*.metodeEvaluasi').notEmpty().withMessage('Metode evaluasi wajib diisi'),
    body('evaluasiList.*.jenisEvaluasi').notEmpty().withMessage('Jenis evaluasi wajib diisi'),
    body('evaluasiList.*.bobotEvaluasi').isFloat({ min: 0.1, max: 100 }).withMessage('Bobot evaluasi per baris tidak valid'),
    
    // Validasi matriks CPMK di dalam baris evaluasi
    body('evaluasiList.*.cpmkData').isArray().withMessage('Data CPMK harus berupa array'),
    body('evaluasiList.*.cpmkData.*.cpmkId').isUUID().withMessage('ID CPMK tidak valid'),
    body('evaluasiList.*.cpmkData.*.bobotCpmk').isFloat({ min: 0 }).withMessage('Bobot sebaran CPMK minimal 0'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) throw new CustomError.BadRequestError(errors.array()[0].msg);
        next();
    }
];