import { body } from "express-validator";

export const validateCreatePengumuman = [
  body("siakPegawaiId")
    .notEmpty()
    .withMessage("Pegawai is required.")
    .isString()
    .withMessage("Pegawai must be a string."),

  body("judul")
    .notEmpty()
    .withMessage("Judul is required.")
    .isString()
    .withMessage("Judul must be a string.")
    .isLength({ min: 5, max: 100 })
    .withMessage("Judul must be between 5 and 100 characters long."),

  body("isi")
    .notEmpty()
    .withMessage("Isi is required.")
    .isString()
    .withMessage("Isi must be a string.")
    .isLength({ min: 5 })
    .withMessage("Isi must Be Minimal 5 characters long."),

  body("isActive")
    .notEmpty()
    .withMessage("isActive is required.")
    .isBoolean()
    .withMessage("isActive must be a Options"),

  body("isPriority")
    .notEmpty()
    .withMessage("isPriority is required.")
    .isBoolean()
    .withMessage("isPriority must be a Options"),

  body("banner")
    .notEmpty()
    .withMessage("banner is required.")
    .isString()
    .withMessage("banner must be a string.")
    .isLength({ min: 5 })
    .withMessage("banner must Be Minimal 5 characters long."),
];
