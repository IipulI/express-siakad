import { body } from "express-validator";

export const validateCreateJenjang = [
  body("nama")
    .notEmpty()
    .withMessage("Nama is required.")
    .isString()
    .withMessage("Nama must be a string.")
    .isLength({ min: 5, max: 30 })
    .withMessage("Nama must be between 5 and 30 characters long."),
  body("jenjang")
    .notEmpty()
    .withMessage("Jenjang is required.")
    .isString()
    .withMessage("Jenjang must be a string.")
    .isLength({ min: 1, max: 5 })
    .withMessage("Nama must be between 5 and 5 characters long."),
];
