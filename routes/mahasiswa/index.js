import { Router } from "express";
import KrsMahasiswaRouter from "./krs-mahasiswa.router.js";
import PengumumanRouter from "./pengumuman.router.js";
import HasilStudiRouter from "./hasil-studi.router.js";
import TranskripRouter from "./transkrip.router.js";

const router = Router();

router.use("/krs", KrsMahasiswaRouter);
router.use("/pengumuman", PengumumanRouter);
router.use("/hasil-studi", HasilStudiRouter);
router.use("/hasil-studi/transkrip", TranskripRouter);

export default router;
