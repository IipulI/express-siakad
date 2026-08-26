import { body } from "express-validator";

export const validateCreateSlotWaktu = [
  body("waktu")
    .notEmpty()
    .withMessage("Waktu is required.")
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage("Waktu must be in HH:mm format."),
];
