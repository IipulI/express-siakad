import { Router } from "express";
// import { validateCreatePeriodeAkademik } from "../../validators/periode-akademik.validators.js";
import * as PendidikanController from "../../controllers/akademik/pendidikan.controller.js";
import { validateCreatePendidikan } from "../../validators/pendidikan.validator.js";
const router = new Router();

router.get("/", PendidikanController.findAll);
router.post("/", validateCreatePendidikan, PendidikanController.create);
router.put("/:id", PendidikanController.updatePendidikan);
router.delete("/:id", PendidikanController.deletePendidikan);

export default router;
