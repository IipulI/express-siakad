// import { Router } from "express";
// import * as BatasSksController from "../../controllers/akademik/batas-sks.controller.js";
// import { validateCreateBatasSks } from "../../validators/batas-sks.validator.js";
// const router = new Router();

// router.get("/", BatasSksController.findAll);
// router.post("/", validateCreateBatasSks, BatasSksController.create)
// router.put("/:id", BatasSksController.updateBatasSks)
// router.delete("/:id", BatasSksController.deleteBatasSks)

// export default router;
import { Router } from "express";
import * as BatasSksController from "../../controllers/akademik/batas-sks.controller.js";
import {
    validateGetBatasSks,
    validateSaveBatasSks,
    validateDeleteBatasSks,
    validateGetPratinjauSalinBatasSks,
    validateSalinBatasSks
} from "../../validators/batas-sks.validator.js";

const router = new Router();

// Tambahkan validator di masing-masing rute
router.get("/", validateGetBatasSks, BatasSksController.fetchBatasSks);
router.post("/", validateSaveBatasSks, BatasSksController.create);
router.put("/:id", validateSaveBatasSks, BatasSksController.updateBatasSks);
router.get("/pratinjau-salin", validateGetPratinjauSalinBatasSks, BatasSksController.fetchPratinjauSalinBatasSks);
router.post("/salin", validateSalinBatasSks, BatasSksController.postSalinBatasSks);
router.delete("/:id", validateDeleteBatasSks, BatasSksController.deleteBatasSks);

export default router;