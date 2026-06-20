import { body, query, param, validationResult } from 'express-validator';
import * as CustomError from '../utils/custom-error.js';

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new CustomError.BadRequestError(errors.array()[0].msg);
    }
    next();
};

export const validateGetBatasSks = [
    query('jenjangId').isUUID().withMessage('Jenjang ID wajib valid UUID'),
    query('tahunKurikulumId').isUUID().withMessage('Tahun Kurikulum ID wajib valid UUID'),
    validate
];

export const validateSaveBatasSks = [
    body('siakJenjangId').isUUID().withMessage('Jenjang ID wajib valid UUID'),
    body('siakTahunKurikulumId').isUUID().withMessage('Tahun Kurikulum ID wajib valid UUID'),
    body('ipsMin').isFloat({ min: 0, max: 4 }).withMessage('IPS Minimal harus angka 0-4'),
    body('ipsMax').isFloat({ min: 0, max: 4 }).withMessage('IPS Maksimal harus angka 0-4'),
    body('batasSks').isInt({ min: 1 }).withMessage('Batas SKS harus berupa angka bulat'),
    validate
];

export const validateDeleteBatasSks = [
    param('id').isUUID().withMessage('ID Batas SKS wajib valid UUID'),
    validate
];

export const validateGetPratinjauSalinBatasSks = [
    query('jenjangIdAsal').isUUID().withMessage('Jenjang ID asal wajib valid UUID'),
    query('tahunKurikulumIdAsal').isUUID().withMessage('Tahun Kurikulum ID asal wajib valid UUID'),
    validate
];

export const validateSalinBatasSks = [
    body('jenjangIdAsal').isUUID().withMessage('Jenjang ID asal wajib valid UUID'),
    body('tahunKurikulumIdAsal').isUUID().withMessage('Tahun Kurikulum ID asal wajib valid UUID'),
    body('jenjangIdTujuan').isUUID().withMessage('Jenjang ID tujuan wajib valid UUID'),
    body('tahunKurikulumIdTujuan').isUUID().withMessage('Tahun Kurikulum ID tujuan wajib valid UUID'),
    validate
];
