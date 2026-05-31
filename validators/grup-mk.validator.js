import { body, query, param, validationResult } from 'express-validator';
import * as CustomError from '../utils/custom-error.js';

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new CustomError.BadRequestError(errors.array()[0].msg);
    next();
};

export const validateGrupMkTable = [
    query('kurikulumId').optional().isUUID().withMessage('Format Kurikulum tidak valid'),
    query('grupId').optional().isUUID().withMessage('Format Grup tidak valid'),
    query('page').optional().isInt({ min: 1 }).withMessage('Halaman minimal 1'),
    query('limit').optional().isInt({ min: 1 }).withMessage('Limit minimal 1'),
    validate
];

export const validateSetGrup = [
    body('mkId').isUUID().withMessage('ID Mata Kuliah wajib valid'),
    body('grupId').isUUID().withMessage('ID Grup wajib valid'),
    validate
];