import { Router } from "express";
import * as KrsMahasiswaController from "../../controllers/mahasiswa/krs-mahasiswa.controller.js";

const router = new Router();

router.get("/", KrsMahasiswaController.getAvailableKrs);
router.get("/info-krs", KrsMahasiswaController.infoKrs);
router.get("/status-menunggu", KrsMahasiswaController.savedKrs);

router.post("/", KrsMahasiswaController.saveKrs);

router.put("/", KrsMahasiswaController.updateKrs);
router.put("/status", KrsMahasiswaController.submitKrs);

router.delete("/:id", KrsMahasiswaController.deleteKrs);

router.use("/riwayat-krs", KrsMahasiswaController.getKrsHistory);

// Riwayat KRS

export default router;
