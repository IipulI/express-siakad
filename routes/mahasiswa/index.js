import { Router } from 'express';
import KrsMahasiswaRouter from "./krs-mahasiswa.router.js";

const router = Router();

router.use("/krs", KrsMahasiswaRouter)

export default router;