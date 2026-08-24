import { Router } from "express";
import * as SlotWaktuController from "../../controllers/akademik/slot-waktu.controller.js";
import { validateCreateSlotWaktu } from "../../validators/slot-waktu.validator.js";

const router = new Router();

router.get("/", SlotWaktuController.findAll);
router.get("/:id", SlotWaktuController.findOneById);
router.post("/", validateCreateSlotWaktu, SlotWaktuController.create);
router.put("/:id", SlotWaktuController.update);
router.delete("/:id", SlotWaktuController.destroy);

export default router;
