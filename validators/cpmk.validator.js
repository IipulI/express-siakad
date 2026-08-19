import { body, param, validationResult } from 'express-validator';
import * as CustomError from '../utils/custom-error.js';

export const validateSaveCpmk = [
    param('id').isUUID().withMessage('ID Mata Kuliah tidak valid'),

    // 0. Pengaturan Level Pemetaan & Metode Pembobotan
    body('levelPemetaan').optional().isIn(['CPMK', 'Sub-CPMK']).withMessage("Level Pemetaan harus 'CPMK' atau 'Sub-CPMK'"),
    body('metodePembobotan').optional().isIn(['Manual', 'Otomatis']).withMessage("Metode Pembobotan harus 'Manual' atau 'Otomatis'"),

    // 1. Validasi Baris Induk (Parent CPMK)
    body('cpmkList').isArray({ min: 1 }).withMessage('Daftar CPMK tidak boleh kosong'),
    body('cpmkList.*.kode').notEmpty().withMessage('Setiap kode CPMK wajib diisi'),
    body('cpmkList.*.deskripsi').notEmpty().withMessage('Deskripsi CPMK wajib diisi'), // 👈 Tambahan
    body('cpmkList.*.bobot').isFloat({ min: 0, max: 100 }).withMessage('Bobot CPMK harus 0-100'),

    // 2. Validasi Sub-Array 1 (Pemetaan CPL di dalam CPMK Induk)
    // Optional -- di levelPemetaan='Sub-CPMK', bobot CPL dipetakan di level
    // subCpmk[].cplPemetaan (lihat di bawah), bukan di sini, jadi field ini
    // boleh tidak ada sama sekali untuk payload mode Sub-CPMK.
    body('cpmkList.*.cplPemetaan').optional().isArray().withMessage('Pemetaan CPL harus berupa array'),
    body('cpmkList.*.cplPemetaan.*.idCpl').isUUID().withMessage('ID CPL tidak valid'),
    body('cpmkList.*.cplPemetaan.*.bobotCpl').isFloat({ min: 0, max: 100 }).withMessage('Bobot CPL tidak valid'),

    // 👇 3. TAMBAHAN BARU: Validasi untuk anak-anaknya (Sub-CPMK) 👇
    body('cpmkList.*.subCpmk')
        .optional()
        .isArray().withMessage('Sub CPMK harus berupa array'),
    body('cpmkList.*.subCpmk.*.kode')
        .notEmpty().withMessage('Kode Sub-CPMK wajib diisi jika ada'),
    body('cpmkList.*.subCpmk.*.deskripsi')
        .notEmpty().withMessage('Deskripsi Sub-CPMK wajib diisi jika ada'),
    body('cpmkList.*.subCpmk.*.cplPemetaan').optional().isArray().withMessage('Pemetaan CPL Sub-CPMK harus berupa array'),
    body('cpmkList.*.subCpmk.*.cplPemetaan.*.idCpl').isUUID().withMessage('ID CPL tidak valid'),
    body('cpmkList.*.subCpmk.*.cplPemetaan.*.bobotCpl').isFloat({ min: 0, max: 100 }).withMessage('Bobot CPL tidak valid'),

    // Eksekutor
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new CustomError.BadRequestError(errors.array()[0].msg);
        }
        next();
    }
];