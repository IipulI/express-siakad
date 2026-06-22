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
    query('jenjangId').isUUID().withMessage('Jenjang ID wajib valid UUID'),
    query('periodeId').optional().isUUID().withMessage('Periode ID harus UUID jika diisi'),
    validate
];

export const validateUpsertSkalaNilai = [
    body('tahunKurikulumId').isUUID().withMessage('Tahun Kurikulum ID wajib valid UUID'),
    body('jenjangId').isUUID().withMessage('Jenjang ID wajib valid UUID'),
    body('periodeId').isUUID().withMessage('Berlaku Sejak Periode wajib dipilih'),

    body('dataSkala').isArray().withMessage('Format tidak valid! dataSkala harus berupa array'),
    body('dataSkala.*.grade').notEmpty().withMessage('Grade wajib diisi'),
    body('dataSkala.*.bobot').isFloat().withMessage('Bobot harus angka'),
    body('dataSkala.*.nilaiBawah').isFloat().withMessage('Nilai Bawah harus angka'),
    body('dataSkala.*.nilaiAtas').isFloat().withMessage('Nilai Atas harus angka'),
    body('dataSkala.*.keterangan').optional().isString(),
    body('dataSkala.*.nilaiDefault').isBoolean().withMessage('Nilai Default harus true/false'),
    validate
];

export const validateGetPratinjauSalinSkalaNilai = [
    query('jenjangIdAsal').isUUID().withMessage('Jenjang ID asal wajib valid UUID'),
    query('tahunKurikulumIdAsal').isUUID().withMessage('Tahun Kurikulum ID asal wajib valid UUID'),
    query('periodeIdAsal').isUUID().withMessage('Berlaku Sejak Periode (asal) wajib dipilih'),
    validate
];

export const validateSalinSkalaNilai = [
    body('jenjangIdAsal').isUUID().withMessage('Jenjang ID asal wajib valid UUID'),
    body('tahunKurikulumIdAsal').isUUID().withMessage('Tahun Kurikulum ID asal wajib valid UUID'),
    body('periodeIdAsal').isUUID().withMessage('Berlaku Sejak Periode (asal) wajib dipilih'),
    body('jenjangIdTujuan').isUUID().withMessage('Jenjang ID tujuan wajib valid UUID'),
    body('tahunKurikulumIdTujuan').isUUID().withMessage('Tahun Kurikulum ID tujuan wajib valid UUID'),
    body('periodeIdTujuan').isUUID().withMessage('Berlaku Sejak Periode (tujuan) wajib dipilih'),
    validate
];
