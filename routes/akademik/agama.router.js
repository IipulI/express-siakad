import { Router } from "express";
import * as AgamaController from "../../controllers/akademik/agama.controller.js";
const router = new Router();

router.get("/", AgamaController.findAll);
router.post("/", AgamaController.create)
router.put("/:id", AgamaController.update)
router.delete("/:id", AgamaController.destroy)
export default router;
