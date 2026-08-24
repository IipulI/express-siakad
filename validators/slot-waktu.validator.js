import { body } from "express-validator";

export const validateCreateSlotWaktu = [
  body("nama")
    .notEmpty()
    .withMessage("Nama is required.")
    .isString()
    .withMessage("Nama must be a string.")
    .isLength({ min: 2, max: 75 })
    .withMessage("Nama must be between 2 and 75 characters long."),
  body("jamMulai")
    .notEmpty()
    .withMessage("Jam Mulai is required.")
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage("Jam Mulai must be in HH:mm format."),
  body("jamSelesai")
    .notEmpty()
    .withMessage("Jam Selesai is required.")
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage("Jam Selesai must be in HH:mm format."),
];
