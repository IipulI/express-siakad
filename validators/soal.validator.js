import { body, param, validationResult } from 'express-validator';
import * as CustomError from '../utils/custom-error.js';

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new CustomError.BadRequestError(errors.array()[0].msg);
    next();
};

export const validateRencanaEvaluasiIdParam = [
    param('rencanaEvaluasiId').isUUID().withMessage('rencanaEvaluasiId tidak valid'),
    validate
];

export const validateSoalIdParam = [
    param('soalId').isUUID().withMessage('soalId tidak valid'),
    validate
];

export const validateCreateSoal = [
    param('rencanaEvaluasiId').isUUID().withMessage('rencanaEvaluasiId tidak valid'),
    body('nomor').notEmpty().withMessage('Nomor soal wajib diisi'),
    body('label').optional().isString(),
    body('jenisUnit').optional().isIn(['OBJEKTIF', 'RUBRIK']).withMessage("jenisUnit harus 'OBJEKTIF' atau 'RUBRIK'"),
    body('skorMaksimal').isFloat({ min: 0 }).withMessage('skorMaksimal harus angka >= 0'),
    body('parentSoalId').optional({ nullable: true }).isUUID().withMessage('parentSoalId tidak valid'),
    body('pemetaanCpmk').optional().isArray().withMessage('pemetaanCpmk harus berupa array'),
    body('pemetaanCpmk.*.cpmkId').optional().isUUID().withMessage('cpmkId tidak valid'),
    body('pemetaanCpmk.*.bobotPoin').optional().isFloat({ min: 0 }).withMessage('bobotPoin harus angka >= 0'),
    validate
];

export const validateCreateSoalBatch = [
    param('rencanaEvaluasiId').isUUID().withMessage('rencanaEvaluasiId tidak valid'),
    body('daftarSoal').isArray({ min: 1 }).withMessage('daftarSoal harus berupa array, minimal 1 soal'),
    body('daftarSoal.*.nomor').notEmpty().withMessage('Nomor soal wajib diisi'),
    body('daftarSoal.*.jenisUnit').optional().isIn(['OBJEKTIF', 'RUBRIK']).withMessage("jenisUnit harus 'OBJEKTIF' atau 'RUBRIK'"),
    body('daftarSoal.*.skorMaksimal').isFloat({ min: 0 }).withMessage('skorMaksimal harus angka >= 0'),
    validate
];

export const validateUpdateSoal = [
    param('soalId').isUUID().withMessage('soalId tidak valid'),
    body('nomor').optional().notEmpty().withMessage('Nomor soal tidak boleh kosong'),
    body('label').optional().isString(),
    body('jenisUnit').optional().isIn(['OBJEKTIF', 'RUBRIK']).withMessage("jenisUnit harus 'OBJEKTIF' atau 'RUBRIK'"),
    body('skorMaksimal').optional().isFloat({ min: 0 }).withMessage('skorMaksimal harus angka >= 0'),
    body('pemetaanCpmk').optional().isArray().withMessage('pemetaanCpmk harus berupa array'),
    body('pemetaanCpmk.*.cpmkId').optional().isUUID().withMessage('cpmkId tidak valid'),
    body('pemetaanCpmk.*.bobotPoin').optional().isFloat({ min: 0 }).withMessage('bobotPoin harus angka >= 0'),
    validate
];

export const validateInputNilaiPerSoal = [
    param('krsId').isUUID().withMessage('krsId tidak valid'),
    body('nilaiSoal').isArray({ min: 1 }).withMessage('nilaiSoal harus berupa array, minimal 1 item'),
    body('nilaiSoal.*.soalId').isUUID().withMessage('soalId tidak valid'),
    // skor opsional kalau jawabanMahasiswa diisi (soal OBJEKTIF) -- skor dihitung sistem dari kunciJawaban
    body('nilaiSoal.*.skor').optional().isFloat({ min: 0 }).withMessage('skor harus angka >= 0'),
    body('nilaiSoal.*.jawabanMahasiswa').optional({ nullable: true }).isString().withMessage('jawabanMahasiswa harus string'),
    body('nilaiSoal').custom((arr) => {
        const adaYangKosong = arr.some(n => n.skor === undefined && !n.jawabanMahasiswa);
        if (adaYangKosong) throw new Error('Tiap item nilaiSoal wajib isi skor ATAU jawabanMahasiswa');
        return true;
    }),
    validate
];
