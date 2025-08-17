import { body } from "express-validator";

export const validateCreatePekerjaan = [
  body("nama")
    .notEmpty()
    .withMessage("Nama is required.")
    .isString()
    .withMessage("Nama must be a string.")
    .isLength({ min: 5, max: 75 })
    .withMessage("Nama must be between 5 and 30 characters long."),
];
