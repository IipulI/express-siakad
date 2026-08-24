import { Router } from "express";
import * as JasAlmamaterController from "../../controllers/akademik/jas-almamater.controller.js";
import { validateCreateJasAlmamater } from "../../validators/jas-almamater.validator.js";

const router = new Router();

router.get("/", JasAlmamaterController.findAll);
router.get("/:id", JasAlmamaterController.findOneById);
router.post("/", validateCreateJasAlmamater, JasAlmamaterController.create);
router.put("/:id", JasAlmamaterController.update);
router.delete("/:id", JasAlmamaterController.destroy);

export default router;
