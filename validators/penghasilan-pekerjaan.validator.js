import { body } from "express-validator";

export const validateCreatePenghasilanPekerjaan = [
  body("range")
    .notEmpty()
    .withMessage("Range is required.")
    .isString()
    .withMessage("Range must be a string.")
    .isLength({ min: 5, max: 75 })
    .withMessage("Nama must be between 5 and 75 characters long."),
];
