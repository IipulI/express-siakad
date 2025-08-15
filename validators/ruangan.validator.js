import { body } from "express-validator";

export const validateCreateRuangan = [
  body("siakFakultasId")
    .notEmpty()
    .withMessage("Fakultas is required.")
    .isString()
    .withMessage("Fakultas must be a string."),

  body("nama")
    .notEmpty()
    .withMessage("Nama is required.")
    .isString()
    .withMessage("Nama must be a string.")
    .isLength({ min: 5, max: 100 })
    .withMessage("Nama must be between 5 and 100 characters long."),

  body("ruangan").notEmpty().withMessage("Ruangan is required."),
  body("kapasitas")
    .notEmpty()
    .withMessage("Kapasitas is required.")
    .isInt()
    .withMessage("Kapasitas must be a Number."),
  body("lantai")
    .notEmpty()
    .withMessage("Lantai is required.")
    .isInt()
    .withMessage("Lantai must be a Number."),
];
