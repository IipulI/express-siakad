import { body } from 'express-validator';

export const validateCreatePeriodeAkademik = [
    body('siakTahunAjaranId')
        .notEmpty().withMessage('siakTahunAjaranId is required')
        .isString().withMessage('siakTahunAjaranId must be a string'),

    body('nama')
        .notEmpty().withMessage('nama is required'),

    body('kode')
        .notEmpty().withMessage('kode is required'),

    body('tanggalMulai')
        .notEmpty().withMessage('tanggalMulai is required'),

    body('tanggalSelesai')
        .notEmpty().withMessage('tanggalSelesai is required')

];