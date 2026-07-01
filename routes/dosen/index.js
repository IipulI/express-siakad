import { Router } from "express";
import pembimbingAkademikRouter from './pembimbing-akademik.router.js'
import jadwalAkademikRouter from "../mahasiswa/jadwal-akademik.router.js";
import kelasKuliahRouter from "../akademik/kelas-kuliah.router.js";

const router = Router();

router.use('/kelas-kuliah', kelasKuliahRouter)
router.use('/pembimbing-akademik', pembimbingAkademikRouter)
router.use('/jadwal-akademik', jadwalAkademikRouter)

export default router;