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
    body('ipsMin').isFloat({ min: 0, max: 4 }).withMessage('IPS Minimal harus angka 0-4'),
    body('ipsMax').isFloat({ min: 0, max: 4 }).withMessage('IPS Maksimal harus angka 0-4'),
    body('batasSks').isInt({ min: 1 }).withMessage('Batas SKS harus berupa angka bulat'),
    validate
];

export const validateDeleteBatasSks = [
    param('id').isUUID().withMessage('ID Batas SKS wajib valid UUID'),
    validate
];