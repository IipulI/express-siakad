import { Router } from "express";
import { getWeeklySchedule } from "../../controllers/orang-tua/jadwal-akademik.controller.js";
import { getHasilStudi } from "../../controllers/orang-tua/hasil-studi.controller.js";

const router = Router();

router.get('/jadwal-akademik/minggu', getWeeklySchedule)
router.get('/hasil-studi', getHasilStudi)

export default router;