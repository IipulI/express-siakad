import { body, query, param, validationResult } from 'express-validator';
import * as CustomError from '../utils/custom-error.js';

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new CustomError.BadRequestError(errors.array()[0].msg);
    next();
};

export const validateGetPredikat = [
    query('tahunKurikulumId').isUUID().withMessage('Tahun Kurikulum ID wajib valid'),
    query('jenjangId').optional().isUUID().withMessage('Jenjang ID tidak valid'),
    query('prodiId').optional().isUUID().withMessage('Prodi ID tidak valid'),
    validate
];

export const validateIdParam = [
    param('id').isUUID().withMessage('ID tidak valid'),
    validate
];

export const validateSavePredikat = [
    param('id').optional().isUUID().withMessage('ID tidak valid'),
    body('siakTahunKurikulumId').isUUID().withMessage('Tahun Kurikulum ID wajib'),
    body('siakJenjangId').isUUID().withMessage('Jenjang ID wajib'),
    body('kode').notEmpty().withMessage('Kode wajib diisi'),
    body('namaInd').notEmpty().withMessage('Nama (IND) wajib diisi'),
    body('ipkMin').isFloat({ min: 0, max: 4 }).withMessage('IPK Min 0.00 - 4.00'),
    body('ipkMax').isFloat({ min: 0, max: 4 }).withMessage('IPK Max 0.00 - 4.00'),
    body('masaStudi').isInt({ min: 1 }).withMessage('Masa Studi harus angka bulat positif'),
    body('isCuti').optional().isBoolean(),
    body('isMengulang').optional().isBoolean(),
    body('isMabaOnly').optional().isBoolean(),
    validate
];

export const validateGetPratinjauSalinPredikat = [
    query('jenjangIdAsal').isUUID().withMessage('Jenjang ID asal wajib valid UUID'),
    query('tahunKurikulumIdAsal').isUUID().withMessage('Tahun Kurikulum ID asal wajib valid UUID'),
    validate
];

export const validateSalinPredikat = [
    body('jenjangIdAsal').isUUID().withMessage('Jenjang ID asal wajib valid UUID'),
    body('tahunKurikulumIdAsal').isUUID().withMessage('Tahun Kurikulum ID asal wajib valid UUID'),
    body('jenjangIdTujuan').isUUID().withMessage('Jenjang ID tujuan wajib valid UUID'),
    body('tahunKurikulumIdTujuan').isUUID().withMessage('Tahun Kurikulum ID tujuan wajib valid UUID'),
    validate
];