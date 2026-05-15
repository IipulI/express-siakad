import { Router } from "express";
import { getWeeklySchedule } from "../../controllers/orang-tua/jadwal-akademik.controller.js";
<<<<<<< HEAD
import { getHasilStudi } from "../../controllers/orang-tua/hasil-studi.controller.js";
=======
import { getHasilStudi, getIpk } from "../../controllers/orang-tua/hasil-studi.controller.js";
>>>>>>> ea1c904 (Menambah fitur get ipk untuk modul orang tua)

const router = Router();

router.get('/jadwal-akademik/minggu', getWeeklySchedule)
router.get('/hasil-studi', getHasilStudi)
<<<<<<< HEAD
=======
router.get('/hasil-studi/ipk', getIpk)
>>>>>>> ea1c904 (Menambah fitur get ipk untuk modul orang tua)

export default router;