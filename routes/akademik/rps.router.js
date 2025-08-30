import { Router } from "express";
// import { validateCreatePeriodeAkademik } from "../../validators/periode-akademik.validators.js";
import * as RpsController from "../../controllers/akademik/rps.controller.js";
import { validateCreateRps } from "../../validators/rps.validator.js";
import { normalizeFilePath, upload } from "../../utils/upload-file.js";
const router = new Router();

router.get("/", RpsController.findAll);
router.post(
  "/",
  upload.single("dokumenRps"),
  normalizeFilePath,
  validateCreateRps,
  RpsController.create
);
router.put("/:id", RpsController.updateRps);
router.delete("/:id", RpsController.deleteRps);

export default router;
