import { Router } from "express";
import * as BidangIlmuController from "../../controllers/akademik/bidang-ilmu.controller.js";
import { validateCreateBidangIlmu } from "../../validators/bidang-ilmu.validator.js";
const router = new Router();

router.get("/", BidangIlmuController.findAll);
router.post("/", validateCreateBidangIlmu, BidangIlmuController.create);
router.put("/:id", BidangIlmuController.updateJenjang);
router.delete("/:id", BidangIlmuController.deleteJenjang);

export default router;
