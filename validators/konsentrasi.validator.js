import { body } from "express-validator";

export const validateCreateKonsentrasi = [
  body("siakProgramStudiId")
    .notEmpty()
    .withMessage("Program Studi is required.")
    .isString()
    .withMessage("Program Studi must be a string."),

  body("kode")
    .notEmpty()
    .withMessage("Kode is required.")
    .isString()
    .withMessage("Kode must be a string."),

  body("nama")
    .notEmpty()
    .withMessage("Nama Konsentrasi is required.")
    .isString()
    .withMessage("Nama Konsentrasi must be a string."),
];
