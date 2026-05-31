import { body, param, query, validationResult } from 'express-validator';
import * as CustomError from '../utils/custom-error.js';

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new CustomError.BadRequestError(errors.array()[0].msg);
    next();
};
export const validateIdParam = [
    param('id').isUUID().withMessage('ID tidak valid'),
    validate
];

export const validateGetRekapSks = [
query('jenjangId').optional().isUUID().withMessage('Parameter jenjangId harus berupa UUID yang valid'),
    query('prodiId').optional().isUUID().withMessage('Parameter prodiId harus berupa UUID yang valid'),
    query('tahunKurikulumId').optional().isUUID().withMessage('Tahun Kurikulum ID harus valid'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page harus angka minimal 1'),
    query('limit').optional().isInt({ min: 1 }).withMessage('Limit harus angka minimal 1'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) throw new CustomError.BadRequestError(errors.array()[0].msg);
        next();
    }
];

export const validateAssignMk = [
    body('mataKuliahId').isUUID().withMessage('Mata Kuliah ID tidak valid'),
    body('semester').isInt({ min: 1, max: 14 }).withMessage('Semester harus angka 1-14'),
    body('nilaiMin').optional().isString(),
    body('statusMk').notEmpty().withMessage('Status MK (Wajib/Pilihan) harus diisi'),
    validate
];
export const validateUpdateMk = [
    param('id').isUUID().withMessage('ID Mata Kuliah tidak valid'),
    body('semester').isInt({ min: 1, max: 14 }).withMessage('Semester harus angka 1-14'),
    body('statusMataKuliah').notEmpty().withMessage('Status Mata Kuliah harus diisi'),
    body('nilaiMinimal').optional().isString(),
    body('prasyaratData').optional().isArray().withMessage('Data prasyarat harus berupa array'),
    // Pastikan konsentrasiIds divalidasi sebagai array of string (UUID)
    body('konsentrasiIds').optional().isArray().withMessage('Data konsentrasi harus berupa array UUID'),
    body('konsentrasiIds.*').optional().isUUID().withMessage('Format ID Konsentrasi tidak valid'),
    validate
];

export const validateRekapTahun = [
    query('page').optional().isInt({ min: 1 }).withMessage('Halaman minimal 1'),
    query('limit').optional().isInt({ min: 1 }).withMessage('Limit minimal 1'),
    validate
];

export const validateListProdi = [
    query('tahunKurikulumId').isUUID().withMessage('Tahun Kurikulum ID tidak valid'),
    query('jenjangId').isUUID().withMessage('Jenjang ID tidak valid'),
    query('page').optional().isInt({ min: 1 }).withMessage('Halaman minimal 1'),
    query('limit').optional().isInt({ min: 1 }).withMessage('Limit minimal 1'),
    validate
];

export const validateSetObe = [
    body('programStudiId').isUUID().withMessage('Program Studi ID wajib UUID'),
    body('tahunKurikulumId').isUUID().withMessage('Tahun Kurikulum ID wajib UUID'),
    body('isObe').isBoolean().withMessage('Status OBE harus true/false'),
    validate
];