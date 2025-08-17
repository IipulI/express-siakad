import { Router } from "express";
// import { validateCreatePeriodeAkademik } from "../../validators/periode-akademik.validators.js";
import * as KebutuhanKhusus from "../../controllers/akademik/kebutuhan-khusus.controller.js";
import { validateCreateKebutuhanKhusus } from "../../validators/kebutuhan-khusus.validator.js";
const router = new Router();

router.get("/", KebutuhanKhusus.findAll);
router.post("/", validateCreateKebutuhanKhusus, KebutuhanKhusus.create);
router.put("/:id", KebutuhanKhusus.updateKebutuhanKhusus);
router.delete("/:id", KebutuhanKhusus.deleteKebutuhanKhusus);

export default router;
