import { body } from "express-validator";

export const validateCreateJenisMataKuliah = [
  body("kode")
    .notEmpty()
    .withMessage("kode is required.")
    .isString()
    .withMessage("kode must be a string."),
  body("nama")
    .notEmpty()
    .withMessage("nama is required.")
    .isString()
    .withMessage("nama must be a string.")
];
