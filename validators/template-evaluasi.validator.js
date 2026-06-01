import { body, query, validationResult } from 'express-validator';
import * as CustomError from '../utils/custom-error.js';

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new CustomError.BadRequestError(errors.array()[0].msg);
    next();
};

// --- 1. VALIDATOR LIST (SUDAH TERMASUK PAGINATION) ---
export const validateGetListTemplate = [
    query('kurikulumId').optional().isUUID().withMessage('ID Kurikulum tidak valid'),
    query('prodiId').optional().isUUID().withMessage('ID Prodi tidak valid'),
    query('jenisMk').optional().isString().withMessage('Jenis MK harus string'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page minimal 1'),
    query('limit').optional().isInt({ min: 1 }).withMessage('Limit minimal 1'),
    validate
];

// --- 2. VALIDATOR DETAIL ---
export const validateGetDetailTemplate = [
    query('kurikulumId').isUUID().withMessage('ID Kurikulum wajib ada'),
    query('prodiId').isUUID().withMessage('ID Prodi wajib ada'),
    query('jenisMk').notEmpty().withMessage('Jenis MK wajib ada'),
    validate
];

// --- 3. VALIDATOR SAVE (BULK) ---
// ... (bagian atas tetap sama)

export const validateSaveTemplate = [
    body('siakTahunKurikulumId').isUUID().withMessage('ID Kurikulum tidak valid'),
    body('siakProgramStudiId').isUUID().withMessage('ID Prodi tidak valid'),
    body('jenisMataKuliah').notEmpty().withMessage('Jenis Mata Kuliah wajib diisi'),
    body('komponenData').isArray({ min: 1 }).withMessage('Komponen evaluasi harus berupa array'),
    
    // 👇 KITA SESUAIKAN KEY-NYA DI SINI 👇
    body('komponenData.*.komponenEvaluasi').notEmpty().withMessage('Nama komponen evaluasi wajib diisi'),
    body('komponenData.*.jenisEvaluasi').notEmpty().withMessage('Metode/Jenis evaluasi wajib diisi'), 
    body('komponenData.*.bobot').isFloat({ min: 1, max: 100 }).withMessage('Bobot harus antara 1-100'),
    validate
];

export const validateDetailKurikulum = [
    query('tahunKurikulumId').isUUID().withMessage('ID Tahun Kurikulum wajib valid'),
    query('jenjangId').isUUID().withMessage('ID Jenjang wajib valid'),
    validate
];

export const validateUpdateObeBulk = [
    body('tahunKurikulumId').isUUID().withMessage('ID Tahun Kurikulum wajib valid'),
    body('prodiSettings').isArray().withMessage('Data prodi harus berupa array'),
    body('prodiSettings.*.programStudiId').isUUID().withMessage('ID Prodi wajib valid'),
    body('prodiSettings.*.isObe').isBoolean().withMessage('Status OBE harus boolean'),
    validate
];