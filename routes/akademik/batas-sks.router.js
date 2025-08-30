import { Router } from "express";
import * as BatasSksController from "../../controllers/akademik/batas-sks.controller.js";
import { validateCreateBatasSks } from "../../validators/batas-sks.validator.js";
const router = new Router();

router.get("/", BatasSksController.findAll);
router.post("/", validateCreateBatasSks, BatasSksController.create)
router.put("/:id", BatasSksController.updateBatasSks)
router.delete("/:id", BatasSksController.deleteBatasSks)

export default router;
