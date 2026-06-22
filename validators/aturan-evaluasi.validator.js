import { body, query, param, validationResult } from 'express-validator';
import * as CustomError from '../utils/custom-error.js';

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new CustomError.BadRequestError(errors.array()[0].msg);
    next();
};

export const validateGetAturanEvaluasi = [
    query('tahunKurikulumId').isUUID().withMessage('Tahun Kurikulum ID wajib valid'),
    query('jenjangId').isUUID().withMessage('Jenjang ID wajib valid'),
    validate
];

export const validateSaveAturanEvaluasi = [
    body('siakTahunKurikulumId').isUUID().withMessage('Tahun Kurikulum ID wajib'),
    body('siakJenjangId').isUUID().withMessage('Jenjang ID wajib'),
    body('semesterKe').isInt({ min: 1, max: 14 }).withMessage('Semester ke- harus antara 1 - 14'),
    body('totalSksMinimal').isInt({ min: 0 }).withMessage('Total SKS Minimal harus berupa angka'),
    body('batasIpkMinimal').isFloat({ min: 0, max: 4 }).withMessage('Batas IPK Minimal harus antara 0.00 - 4.00'),
    validate
];

export const validateIdParam = [
    param('id').isUUID().withMessage('ID tidak valid'),
    validate
];

export const validateGetPratinjauSalinAturanEvaluasi = [
    query('jenjangIdAsal').isUUID().withMessage('Jenjang ID asal wajib valid UUID'),
    query('tahunKurikulumIdAsal').isUUID().withMessage('Tahun Kurikulum ID asal wajib valid UUID'),
    validate
];

export const validateSalinAturanEvaluasi = [
    body('jenjangIdAsal').isUUID().withMessage('Jenjang ID asal wajib valid UUID'),
    body('tahunKurikulumIdAsal').isUUID().withMessage('Tahun Kurikulum ID asal wajib valid UUID'),
    body('jenjangIdTujuan').isUUID().withMessage('Jenjang ID tujuan wajib valid UUID'),
    body('tahunKurikulumIdTujuan').isUUID().withMessage('Tahun Kurikulum ID tujuan wajib valid UUID'),
    validate
];