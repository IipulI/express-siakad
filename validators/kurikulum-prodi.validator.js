import { body, query, param, validationResult } from 'express-validator';
import * as CustomError from '../utils/custom-error.js';

const validate = (req, res, next) => {
    console.log("Data yang masuk ke Body:", req.body); // 👈 TAMBAHKAN INI BANG
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log("Detail Error Validator:", errors.array()); // Biar kelihatan field mana yang marah
        throw new CustomError.BadRequestError(errors.array()[0].msg);
    }
    next();
};
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
    body('targetCpl').optional().isFloat({ min: 0, max: 100 }).withMessage('Target CPL harus angka 0-100'),
    body('targetCpmk').optional().isFloat({ min: 0, max: 100 }).withMessage('Target CPMK harus angka 0-100'),
    validate // Jangan lupa panggil middleware validate-nya Bang!
];
export const validateDetailKurikulum = [
    query('tahunKurikulumId').isUUID().withMessage('ID Tahun Kurikulum wajib valid'),
    query('jenjangId').isUUID().withMessage('ID Jenjang wajib valid'),
    validate
];

export const validateUpdateObeBulk = [
    // 1. Validasi ID yang memang di luar array (root)
    body('tahunKurikulumId').isUUID().withMessage('Tahun Kurikulum ID wajib UUID'),

    // 2. Validasi bahwa prodiSettings beneran array
    body('prodiSettings').isArray().withMessage('Data prodi harus berupa array'),

    // 3. 👇 INI KUNCINYA: Pakai tanda bintang (*) untuk masuk ke tiap item array
    body('prodiSettings.*.programStudiId')
        .isUUID()
        .withMessage('Program Studi ID wajib UUID'),

    body('prodiSettings.*.isObe')
        .isBoolean()
        .withMessage('Status OBE harus true/false'),

    validate // Middleware yang isinya validationResult(req) tadi
];
export const validateStoreKurikulum = [
    body('tahun').isNumeric().withMessage('Tahun harus berupa angka'),
    body('keterangan').notEmpty().withMessage('Keterangan wajib diisi'),
    body('siakPeriodeAkademikId').isUUID().withMessage('Periode Akademik wajib dipilih'), // 👈 Ini bapaknya "Mulai Berlaku"
    body('tanggalMulai').isDate().withMessage('Format tanggal mulai salah (YYYY-MM-DD)'),
    body('tanggalSelesai').isDate().withMessage('Format tanggal selesai salah (YYYY-MM-DD)'),
    validate
];