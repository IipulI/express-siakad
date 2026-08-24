import { body } from "express-validator";

export const validateCreateJenisPertemuan = [
  body("nama")
    .notEmpty()
    .withMessage("Nama is required.")
    .isString()
    .withMessage("Nama must be a string.")
    .isLength({ min: 2, max: 75 })
    .withMessage("Nama must be between 2 and 75 characters long."),
];
