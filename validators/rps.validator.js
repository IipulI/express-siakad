import { body } from "express-validator";

export const validateCreateRps = [
  body("siakMataKuliahId")
    .notEmpty()
    .withMessage("siakMataKuliahId wajib diisi")
    .isInt()
    .withMessage("siakMataKuliahId harus berupa angka"),

  body("tanggalPenyusunan")
    .notEmpty()
    .withMessage("tanggalPenyusunan wajib diisi")
    .isISO8601()
    .withMessage("tanggalPenyusunan harus berupa tanggal valid (YYYY-MM-DD)"),

  body("deskripsiMataKuliah")
    .notEmpty()
    .withMessage("deskripsiMataKuliah wajib diisi")
    .isString()
    .withMessage("deskripsiMataKuliah harus berupa teks"),

  body("tujuanMataKuliah")
    .notEmpty()
    .withMessage("tujuanMataKuliah wajib diisi")
    .isString()
    .withMessage("tujuanMataKuliah harus berupa teks"),

  body("materiPembelajaran")
    .optional()
    .isString()
    .withMessage("materiPembelajaran harus berupa teks"),

  body("pustakaUtama")
    .optional()
    .isString()
    .withMessage("pustakaUtama harus berupa teks"),

  body("pustakaPendukung")
    .optional()
    .isString()
    .withMessage("pustakaPendukung harus berupa teks"),
];
