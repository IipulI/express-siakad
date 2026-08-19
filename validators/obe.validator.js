// 👇 Tambahkan 'body' dan 'param' di dalam import
import { body, query, param, validationResult } from 'express-validator';
import * as CustomError from '../utils/custom-error.js';

/**
 * Middleware untuk mengeksekusi validasi
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // Menggunakan CustomError milik Abang
        throw new CustomError.BadRequestError(errors.array()[0].msg);
    }
    next();
};

// --- 1. VALIDATOR DASHBOARD (GET) ---
export const validateManajemenCapaian = [
    query('page').optional().isInt({ min: 1 }).withMessage('Halaman minimal 1'),
    query('limit').optional().isInt({ min: 1 }).withMessage('Limit minimal 1'),
    query('tahunKurikulumId').optional().isUUID().withMessage('Format Tahun Kurikulum salah'),
    query('prodiId').optional().isUUID().withMessage('Format Prodi salah'),
    query('jenjangId').optional().isUUID().withMessage('Format Jenjang salah'),
    validate // 👈 Pakai konstanta validate yang sudah dibuat di atas biar rapi
];

// --- 2. VALIDATOR TAMBAH PL (POST) ---
export const validateStoreProfilLulusan = [
    body('siakObeId').isUUID().withMessage('ID OBE tidak valid'),
    body('kode').notEmpty().withMessage('Kode PL wajib diisi'),
    body('profil').notEmpty().withMessage('Profil Lulusan wajib diisi'),
    body('deskripsi').notEmpty().withMessage('Deskripsi (IND) wajib diisi'),
    validate
];

// --- 3. VALIDATOR UPDATE PL (PUT) ---
export const validateUpdateProfilLulusan = [
    param('id').isUUID().withMessage('ID PL tidak valid'),
    body('kode').notEmpty().withMessage('Kode PL wajib diisi'),
    body('profil').notEmpty().withMessage('Profil Lulusan wajib diisi'),
    body('deskripsi').notEmpty().withMessage('Deskripsi (IND) wajib diisi'),
    validate
];
export const validateStoreCpl = [
    body('siakObeId').isUUID().withMessage('ID OBE tidak valid'),
    body('kode').notEmpty().withMessage('Kode CPL wajib diisi'),
    body('deskripsi').notEmpty().withMessage('Deskripsi (IND) wajib diisi'),
    body('targetCpl').isFloat({ min: 0 }).withMessage('Target CPL harus berupa angka'),
    body('kategori').notEmpty().withMessage('Kategori wajib dipilih'),
    validate
];

export const validateUpdateCpl = [
    param('cplId').isUUID().withMessage('ID CPL tidak valid'),
    body('kode').notEmpty().withMessage('Kode CPL wajib diisi'),
    body('deskripsi').notEmpty().withMessage('Deskripsi (IND) wajib diisi'),
    body('targetCpl').isFloat({ min: 0 }).withMessage('Target CPL harus berupa angka'),
    body('kategori').notEmpty().withMessage('Kategori wajib dipilih'),
    validate
];

export const validateStoreIK = [
    body('siakCplId').isUUID().withMessage('ID CPL tidak valid'),
    body('kode').notEmpty().withMessage('Kode Indikator wajib diisi'),
    body('deskripsi').notEmpty().withMessage('Deskripsi (IND) wajib diisi'),
    validate
];

export const validateUpdateIK = [
    param('id').isUUID().withMessage('ID Indikator tidak valid'),
    body('kode').notEmpty().withMessage('Kode Indikator wajib diisi'),
    body('deskripsi').notEmpty().withMessage('Deskripsi (IND) wajib diisi'),
    validate
];
export const validateSaveMatriksPlCpl = [
    param('obeId').isUUID().withMessage('ID OBE tidak valid'),
    body('pemetaan').isArray({ min: 1 }).withMessage('Data pemetaan harus berupa array'),
    body('pemetaan.*.plId').isUUID().withMessage('ID PL harus UUID'),
    body('pemetaan.*.cplId').isUUID().withMessage('ID CPL harus UUID'),
    body('pemetaan.*.bobot').isFloat({ min: 0, max: 100 }).withMessage('Bobot harus angka 0-100'),
    validate
];
export const validateSaveMatriksCplMk = [
    param('obeId').isUUID().withMessage('ID OBE tidak valid'),
    body('pemetaan').isArray().withMessage('Data pemetaan harus berupa array'),
    body('pemetaan.*.mkId').isUUID().withMessage('ID Mata Kuliah harus UUID'),
    body('pemetaan.*.cplId').isUUID().withMessage('ID CPL harus UUID'),
    validate
];