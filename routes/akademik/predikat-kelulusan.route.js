import express from 'express';
import * as PredikatController from "../../controllers/akademik/predikat-kelulusan.controller.js";
import { 
    validateGetPredikat, 
    validateSavePredikat, 
    validateIdParam 
} from "../../validators/predikat-kelulusan.validator.js";

const router = express.Router();

// 1. GET LIST
router.get("/", validateGetPredikat, PredikatController.fetchPredikat);

// 2. GET DETAIL (Harus ditaruh setelah rute "/" agar tidak bentrok)
router.get("/:id", validateIdParam, PredikatController.getDetail);

// 3. POST: Simpan atau Update (Sesuai Form Gambar 3)
router.post("/", validateSavePredikat, PredikatController.savePredikat);
router.put("/:id", validateSavePredikat, PredikatController.savePredikat);

// 4. DELETE
router.delete("/:id", validateIdParam, PredikatController.deletePredikat);

export default router;