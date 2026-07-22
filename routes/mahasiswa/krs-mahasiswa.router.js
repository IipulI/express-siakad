import { Router } from "express";
import * as KrsMahasiswaController from "../../controllers/mahasiswa/krs-mahasiswa.controller.js";

const router = new Router();

router.get("/", KrsMahasiswaController.getAvailableKrs);
router.get("/info-krs", KrsMahasiswaController.infoKrs);
router.get("/status-menunggu", KrsMahasiswaController.savedKrs);
router.get("/riwayat-krs", KrsMahasiswaController.getKrsHistory);
// router.get('/pembayaran', KrsMahasiswaController.)

router.post("/", KrsMahasiswaController.saveKrs);

router.put("/", KrsMahasiswaController.updateKrs);
router.put("/status", KrsMahasiswaController.submitKrs);

router.delete("/:id", KrsMahasiswaController.deleteKrs);


// Riwayat KRS

export default router;
