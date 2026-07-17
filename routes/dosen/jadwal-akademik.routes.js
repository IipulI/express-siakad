import { Router } from "express";
import * as jadwalAkademikController from  "../../controllers/dosen/jadwal-akademik.controller.js"

const router = Router();

router.get('/', jadwalAkademikController.getWeeklySchedule)

export default router;