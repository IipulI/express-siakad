import { Router } from "express";
// import { validateCreatePeriodeAkademik } from "../../validators/periode-akademik.validators.js";
import * as JenjangController from "../../controllers/akademik/jenjang.controller.js";
import { validateCreateJenjang } from "../../validators/jenjang.validator.js";
const router = new Router();

router.get("/", JenjangController.findAll);
router.post("/", validateCreateJenjang, JenjangController.create);
router.put("/:id", JenjangController.updateJenjang);
router.delete("/:id", JenjangController.deleteJenjang);

export default router;
