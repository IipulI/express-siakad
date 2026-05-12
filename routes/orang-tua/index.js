import { Router } from "express";
import { getWeeklySchedule } from "../../controllers/orang-tua/jadwal-akademik.controller.js";

const router = Router();

router.get('/jadwal-akademik/minggu', getWeeklySchedule)

export default router;