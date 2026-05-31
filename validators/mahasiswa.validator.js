import { body } from "express-validator";

export const validateCreateMahasiswa = [
    body('nama')
        .notEmpty().withMessage("Nama harus diisi")
        .isString().withMessage("Nama harus berisikan teks"),

    body('npm')
        .notEmpty().withMessage("Npm harus diisi")
        .isNumeric().withMessage("Format npm harus berisikan angka"),

    body('siakProgramStudi')
        .notEmpty().withMessage("Program Studi harus diisi"),

    body('siakPeriodeMasuk')
        .notEmpty().withMessage("Periode Masuk harus diisi"),

    body('siakSistemKuliah')
        .notEmpty().withMessage("Sistem Kuliah harus diisi"),

    body('siakJenisPendaftaran')
        .notEmpty().withMessage("Jenis Pendaftaran harus diisi"),

    body('siakJalurPendaftaran')
        .notEmpty().withMessage("Jelur Pendaftaran harus diisi"),

    body('gelombang')
        .notEmpty().withMessage("Gelombang harus diisi"),

    body('jenisKelamin')
        .notEmpty().withMessage("Jenis Kelamin harus diisi"),

    body('tempatLahir')
        .notEmpty().withMessage("Tempat Lahir harus diisi"),

    body('tanggalLahir')
        .notEmpty().withMessage("Tanggal Lahir harus diisi"),

    body('kewarganegaraan')
        .trim()
        .toLowerCase()
        .notEmpty()
        .withMessage("Kewarganegaraan harus diisi"),

    body().custom((_, { req }) => {
        if(body.req.kewarganegaraan === 'indonesia') {
            if (!req.body.nik) throw new Error("Nik harus diisi");
        } else {
            if(!req.body.paspor) throw new Error('Paspor harus diisi');
        }

        return true
    }),

    body
];