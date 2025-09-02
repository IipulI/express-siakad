import { body } from "express-validator";

export const validateCreateBatasSks = [
  body("siakJenjangId")
    .notEmpty()
    .withMessage("siakJenjangId is required.")
    .isUUID()
    .withMessage("siakJenjangId must be a UUID."),
  body("ipsMin")
    .notEmpty()
    .withMessage("ipsMin is required.")
    .isDecimal()
    .withMessage("ipsMin must be a Decimal."),

  body("ipsMax")
    .notEmpty()
    .withMessage("ipsMax is required.")
    .isDecimal()
    .withMessage("ipsMax must be a Decimal."),
  
  body("batasSks")
    .notEmpty()
    .withMessage("batasSks is required.")
    .isInt()
    .withMessage("batasSks must be a Int."),
];

