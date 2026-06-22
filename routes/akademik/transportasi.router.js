import { Router } from "express";
import * as TransportasiController from "../../controllers/akademik/transportasi.controller.js";

const router = new Router();

router.get("/", TransportasiController.findAll);
router.get("/:id", TransportasiController.findOneById);
router.post("/", TransportasiController.create);
router.put("/:id", TransportasiController.update);
router.delete('/:id', TransportasiController.destroy);

export default router;