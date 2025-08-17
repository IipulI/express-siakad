import { body } from "express-validator";

export const validateCreateKebutuhanKhusus = [
  body("nama")
    .notEmpty()
    .withMessage("Nama is required.")
    .isString()
    .withMessage("Nama must be a string.")
    .isLength({ min: 5, max: 50 })
    .withMessage("Nama must be between 5 and 30 characters long."),
];
