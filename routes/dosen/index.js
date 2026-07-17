import { Router } from "express";
import pembimbingAkademikRouter from './pembimbing-akademik.router.js'
// import jadwalAkademikRouter from "../mahasiswa/jadwal-akademik.router.js";
import jadwalAkademikRouter from "./jadwal-akademik.routes.js";
import kelasKuliahRouter from "../akademik/kelas-kuliah.router.js";

const router = Router();

router.use('/kelas-kuliah', kelasKuliahRouter)
router.use('/pembimbing-akademik', pembimbingAkademikRouter)
router.use('/jadwal-akademik', jadwalAkademikRouter)

// TODO : Dosen melihat KRS mahasiswa
// TODO : Dosen melihat jadwal mingguan

export default router;