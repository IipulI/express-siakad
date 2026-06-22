import { body, param, query, validationResult } from 'express-validator';
import * as CustomError from '../utils/custom-error.js';

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new CustomError.BadRequestError(errors.array()[0].msg);
    }
    next();
};

// 1. Validasi Get List
export const validateGetCplUmum = [
    param('tahunKurikulumId').isUUID().withMessage('Tahun Kurikulum ID tidak valid'),
    query('kategori').optional().isString(),
    query('search').optional().isString(),
    validate
];

// 2. Validasi Create / Update (Sesuai dengan kolom di UI)
export const validateSaveCplUmum = [
    param('tahunKurikulumId').isUUID().withMessage('Tahun Kurikulum ID tidak valid'),
    body('id').optional().isUUID().withMessage('ID CPL Umum tidak valid'), // Opsional karena kalau Create nggak bawa ID
    body('kode').notEmpty().withMessage('Kode CPL wajib diisi').isLength({ max: 25 }).withMessage('Kode CPL maksimal 25 karakter'),
    body('deskripsiInd').notEmpty().withMessage('Deskripsi CPL (ID) wajib diisi'),
    body('targetCpl').isFloat({ min: 0, max: 100 }).withMessage('Target CPL harus angka 0-100'),
    body('kategori').notEmpty().withMessage('Kategori wajib dipilih'),
    // null/kosong = Tingkat CPL berlaku di level Universitas; kalau diisi
    // harus UUID Fakultas yang valid (dicek lebih lanjut di service)
    body('siakFakultasId').optional({ nullable: true }).isUUID().withMessage('Tingkat CPL (Fakultas) tidak valid'),
    validate
];

// 3. Validasi Delete
export const validateDeleteCplUmum = [
    param('id').isUUID().withMessage('ID CPL Umum tidak valid'),
    validate
];