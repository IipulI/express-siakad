import { body } from "express-validator";

export const validateCreateJalurPendaftaran = [
  body("nama")
    .notEmpty()
    .withMessage("nama is required.")
    .isString()
    .withMessage("nama must be a String."),
];

