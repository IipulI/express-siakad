import { Router } from "express";
import * as FakultasController from "../../controllers/akademik/fakultas.controller.js";

const router = new Router();

router.get("/", FakultasController.findAll);
router.get("/:id", FakultasController.findOneById);
router.post("/", FakultasController.createFakultas);
router.put("/:id", FakultasController.updateFakultas);
router.delete("/:id", FakultasController.deleteFakultas);

export default router;
