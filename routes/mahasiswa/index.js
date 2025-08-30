import { Router } from "express";
import KrsMahasiswaRouter from "./krs-mahasiswa.router.js";
import PengumumanRouter from "./pengumuman.router.js";

const router = Router();

router.use("/krs", KrsMahasiswaRouter);
router.use("/pengumuman", PengumumanRouter);

export default router;
