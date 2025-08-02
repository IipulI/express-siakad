import { body } from 'express-validator';

export const validateCreateTahunAjaran = [
    body('tahun')
        .notEmpty().withMessage('Tahun is required.')
        .isString().withMessage('Tahun must be a string.')
        .isLength({ min: 4, max: 5 }).withMessage('Tahun must be 4 or 5 characters long (e.g., "2023" or "2023/4").'),

    body('nama')
        .notEmpty().withMessage('Nama is required.')
        .isString().withMessage('Nama must be a string.')
        .isLength({ min: 5, max: 50 }).withMessage('Nama must be between 5 and 50 characters long.')
];