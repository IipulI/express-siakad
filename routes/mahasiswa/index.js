import { Router } from "express";
import KrsMahasiswaRouter from "./krs-mahasiswa.router.js";
import PengumumanRouter from "./pengumuman.router.js";
import HasilStudiRouter from "./hasil-studi.router.js";
import TranskripRouter from "./transkrip.router.js";
import JadwalAkademikRouter from "./jadwal-akademik.router.js";
import pembayaranRouter from "./pembayaran.router.js";
import { getDashboardMahasiswa } from "../../controllers/mahasiswa/dashboard.controller.js";

const router = Router();

router.get("/dashboard/akademik", getDashboardMahasiswa)

router.use("/krs", KrsMahasiswaRouter);
router.use('/jadwal-akademik', JadwalAkademikRouter)
router.use("/pengumuman", PengumumanRouter);
router.use("/hasil-studi", HasilStudiRouter);
router.use("/hasil-studi/transkrip", TranskripRouter);
router.use("/pembayaran", pembayaranRouter)

export default router;
