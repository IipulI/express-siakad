import { body } from "express-validator";

export const validateCreateJasAlmamater = [
  body("nama")
    .notEmpty()
    .withMessage("Nama is required.")
    .isString()
    .withMessage("Nama must be a string.")
    .isLength({ min: 1, max: 75 })
    .withMessage("Nama must be between 1 and 75 characters long."),
];
