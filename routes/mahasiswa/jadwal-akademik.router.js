import { Router } from "express";
import * as jadwalAkademikController from  "../../controllers/mahasiswa/jadwal-akademik.controller.js"

const router = Router();

// router.get('/', jadwalAkademikController.)
router.get('/minggu', jadwalAkademikController.getWeeklySchedule)
router.get('/harian', jadwalAkademikController.getDailySchedule)

export default router;