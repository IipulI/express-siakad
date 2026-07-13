import { body, param, validationResult } from 'express-validator';
import * as CustomError from '../utils/custom-error.js';

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new CustomError.BadRequestError(errors.array()[0].msg);
    next();
};

export const validatePostNilaiDariCbt = [
    param('rencanaEvaluasiId').isUUID().withMessage('rencanaEvaluasiId tidak valid'),
    body('daftarNilai').isArray({ min: 1 }).withMessage('daftarNilai harus berupa array, minimal 1 mahasiswa'),
    body('daftarNilai.*.krsId').isUUID().withMessage('krsId tidak valid'),
    body('daftarNilai.*.nilaiAkhir').isFloat({ min: 0, max: 100 }).withMessage('nilaiAkhir harus angka 0-100'),
    body('daftarNilai.*.breakdown').isArray({ min: 1 }).withMessage('breakdown harus berupa array, minimal 1 Sub-CPMK'),
    body('daftarNilai.*.breakdown.*.cpmkId').isUUID().withMessage('cpmkId tidak valid'),
    body('daftarNilai.*.breakdown.*.skorMentah').isFloat({ min: 0, max: 100 }).withMessage('skorMentah harus angka 0-100'),
    validate
];
