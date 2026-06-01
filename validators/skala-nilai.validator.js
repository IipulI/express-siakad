import { body, query, validationResult } from 'express-validator';
import * as CustomError from '../utils/custom-error.js';

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new CustomError.BadRequestError(errors.array()[0].msg);
    }
    next();
};

export const validateGetSkalaNilai = [
    query('tahunKurikulumId').isUUID().withMessage('Tahun Kurikulum ID wajib valid UUID'),
    query('periodeId').optional().isUUID().withMessage('Periode ID harus UUID jika diisi'),
    query('programStudiId').optional().isUUID().withMessage('Program Studi ID tidak valid'),
    query('jenjangId').optional().isUUID().withMessage('Jenjang ID tidak valid'),
    validate
];

export const validateUpsertSkalaNilai = [
    body('tahunKurikulumId').isUUID().withMessage('Tahun Kurikulum ID wajib valid UUID'),
    body('periodeId').optional().isUUID().withMessage('Periode ID tidak valid'),
    body('programStudiId').optional().isUUID().withMessage('Program Studi ID tidak valid'),
    body('jenjangId').optional().isUUID().withMessage('Jenjang ID tidak valid'),
    
    // Validasi Array
    body('dataSkala').isArray().withMessage('Format tidak valid! dataSkala harus berupa array'),
    body('dataSkala.*.grade').notEmpty().withMessage('Grade wajib diisi'),
    body('dataSkala.*.bobot').isFloat().withMessage('Bobot harus angka'),
    body('dataSkala.*.nilaiBawah').isFloat().withMessage('Nilai Bawah harus angka'),
    body('dataSkala.*.nilaiAtas').isFloat().withMessage('Nilai Atas harus angka'),
    body('dataSkala.*.keterangan').optional().isString(),
    body('dataSkala.*.nilaiDefault').isBoolean().withMessage('Nilai Default harus true/false'),
    validate
];