import { Router } from "express";
import * as jadwalAkademikController from  "../../controllers/mahasiswa/jadwal-akademik.controller.js"

const router = Router();

router.get('/minggu', jadwalAkademikController.getWeeklySchedule)

export default router;