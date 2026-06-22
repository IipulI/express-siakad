import { Router } from "express";
import * as JenisTinggalController from "../../controllers/akademik/jenis-tinggal.controller.js";

const router = new Router();

router.get("/", JenisTinggalController.findAll);
router.get("/:id", JenisTinggalController.findOneById);
router.post("/", JenisTinggalController.create);
router.put("/:id", JenisTinggalController.update);
router.delete('/:id', JenisTinggalController.destroy)

export default router;