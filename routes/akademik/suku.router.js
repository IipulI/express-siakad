import { Router } from "express";
import * as SukuController from "../../controllers/akademik/suku.controller.js";
const router = new Router();

router.get("/", SukuController.findAll);
router.post("/", SukuController.create);
router.put("/:id", SukuController.update)
router.delete("/:id", SukuController.destroy)

export default router;

