import { body, query, param, validationResult } from 'express-validator';
import * as CustomError from '../utils/custom-error.js';

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new CustomError.BadRequestError(errors.array()[0].msg);
    next();
};

export const validateGetEkivalensi = [
    query('prodiId').isUUID().withMessage('Prodi ID tidak valid'),
    query('kurikulumBaruId').isUUID().withMessage('ID Kurikulum Baru tidak valid'),
    query('kurikulumLamaId').isUUID().withMessage('ID Kurikulum Lama tidak valid'),
    validate
];

export const validateBulkSaveEkivalensi = [
    body('dataEkivalensi').isArray({ min: 1 }).withMessage('Data ekivalensi harus berupa array'),
    body('dataEkivalensi.*.mkBaruId').isUUID().withMessage('ID Mata Kuliah Baru tidak valid'),
    // mkLamaId boleh null/empty jika user ingin menghapus mapping di baris itu
    body('dataEkivalensi.*.mkLamaId').optional({ nullable: true, checkFalsy: true }).isUUID().withMessage('ID Mata Kuliah Lama tidak valid'),
    validate
];