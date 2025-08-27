import { Router } from "express";
import * as JalurPendaftaranController from "../../controllers/akademik/jalur-pendaftaran.controller.js";
import { validateCreateJalurPendaftaran } from "../../validators/jalur-pendaftaran.validator.js";
const router = new Router();

router.get("/", JalurPendaftaranController.findAll);
router.post("/", validateCreateJalurPendaftaran, JalurPendaftaranController.create)
router.put("/:id", JalurPendaftaranController.updateJalurPendaftaran)
//router.delete("/:id", JalurPendaftaranController.deleteJalurPendaftaran)

export default router;
