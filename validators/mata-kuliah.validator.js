import { body, param, validationResult } from 'express-validator';
import * as CustomError from '../utils/custom-error.js';

// 👇 PASTIKAN ADA KATA 'export' DAN NAMANYA SAMA PERSIS
export const validateCreateMkObe = [
    body('siakProgramStudiId').isUUID().withMessage('ID Program Studi harus format UUID'),
    body('siakTahunKurikulumId').isUUID().withMessage('ID Tahun Kurikulum harus format UUID'),
    body('kode').notEmpty().withMessage('Kode Mata Kuliah wajib diisi'),
    body('nama').notEmpty().withMessage('Nama Mata Kuliah wajib diisi'),
    body('jenis').notEmpty().withMessage('Jenis Mata Kuliah wajib diisi'),
    body('adaPraktikum').isBoolean().withMessage('Ada Praktikum wajib diisi (boolean)'),
    body('koordinatorMkId').optional({ checkFalsy: true }).isUUID().withMessage('ID Koordinator wajib format UUID'),
    body('pengembangRpsIds').optional({ checkFalsy: true }).isArray().withMessage('Pengembang RPS harus berupa Array'),
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // Ambil pesan error pertama, lempar ke Custom Error
            throw new CustomError.BadRequestError(errors.array()[0].msg);
        }
        next();
    }
];

export const validateUpdateMkObe = [
    // Sekarang param('id') di sini sudah tidak akan error lagi
    param('id').isUUID().withMessage('ID Mata Kuliah tidak valid'), 
    body('siakProgramStudiId').optional().isUUID().withMessage('ID Program Studi harus format UUID'),
    body('kode').optional().notEmpty().withMessage('Kode Mata Kuliah tidak boleh kosong'),
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new CustomError.BadRequestError(errors.array()[0].msg);
        }
        next();
    }
];

export const validateDeleteMkObe = [
    // Di sini juga aman
    param('id').isUUID().withMessage('ID Mata Kuliah tidak valid'), 
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) throw new CustomError.BadRequestError(errors.array()[0].msg);
        next();
    }
];

export const validateSaveCplMapping = [
    param('id').isUUID().withMessage('ID Mata Kuliah tidak valid'),
    body('cplIds').isArray().withMessage('cplIds harus berupa Array (daftar ID CPL)'),
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new CustomError.BadRequestError(errors.array()[0].msg);
        }
        next();
    }
];