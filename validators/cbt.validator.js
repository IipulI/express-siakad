import { body, param, validationResult } from 'express-validator';
import * as CustomError from '../utils/custom-error.js';

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new CustomError.BadRequestError(errors.array()[0].msg);
    next();
};

// Breakdown Sub-CPMK per komponen -- TIDAK ADA nilaiAkhir di sini (lihat
// validatePostNilaiAkhirDariCbt, sengaja dipisah total).
export const validatePostNilaiDariCbt = [
    param('rencanaEvaluasiId').isUUID().withMessage('rencanaEvaluasiId tidak valid'),
    body('daftarNilai').isArray({ min: 1 }).withMessage('daftarNilai harus berupa array, minimal 1 mahasiswa'),
    body('daftarNilai.*.krsId').isUUID().withMessage('krsId tidak valid'),
    // breakdown = daftar unit penilaian (soal PG/esai, kriteria presentasi, tahap
    // proyek, dst -- generik). Ephemeral, tidak disimpan permanen di NL-SIAK.
    body('daftarNilai.*.breakdown').isArray({ min: 1 }).withMessage('breakdown harus berupa array, minimal 1 unit penilaian'),
    body('daftarNilai.*.breakdown.*.skorDiperoleh').isFloat({ min: 0 }).withMessage('skorDiperoleh harus angka >= 0'),
    body('daftarNilai.*.breakdown.*.skorMaksimal').isFloat({ gt: 0 }).withMessage('skorMaksimal harus angka > 0'),
    body('daftarNilai.*.breakdown.*.pemetaanCpmk').isArray({ min: 1 }).withMessage('pemetaanCpmk harus berupa array, minimal 1 CPMK/Sub-CPMK'),
    body('daftarNilai.*.breakdown.*.pemetaanCpmk.*.cpmkId').isUUID().withMessage('cpmkId tidak valid'),
    body('daftarNilai.*.breakdown.*.pemetaanCpmk.*.bobotPoin').isFloat({ gt: 0 }).withMessage('bobotPoin harus angka > 0'),
    validate
];

// Nilai akhir + huruf mutu + angka mutu MK -- sync langsung dari CBT, tanpa
// dihitung ulang. Tidak butuh rencanaEvaluasiId sama sekali (ini level MK,
// bukan level komponen).
export const validatePostNilaiAkhirDariCbt = [
    body('daftarNilai').isArray({ min: 1 }).withMessage('daftarNilai harus berupa array, minimal 1 mahasiswa'),
    body('daftarNilai.*.krsId').isUUID().withMessage('krsId tidak valid'),
    body('daftarNilai.*.nilaiAkhir').isFloat({ min: 0, max: 100 }).withMessage('nilaiAkhir harus angka 0-100'),
    body('daftarNilai.*.hurufMutu').isString().notEmpty().withMessage('hurufMutu wajib diisi'),
    body('daftarNilai.*.angkaMutu').isFloat({ min: 0, max: 4 }).withMessage('angkaMutu harus angka 0-4'),
    validate
];

export const validateRencanaEvaluasiIdParam = [
    param('rencanaEvaluasiId').isUUID().withMessage('rencanaEvaluasiId tidak valid'),
    validate
];

export const validateResetKomponenCbt = [
    param('rencanaEvaluasiId').isUUID().withMessage('rencanaEvaluasiId tidak valid'),
    param('krsId').isUUID().withMessage('krsId tidak valid'),
    validate
];
