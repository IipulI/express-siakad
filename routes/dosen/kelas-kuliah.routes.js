import { Router } from "express";
import * as kelasKuliahController from  "../../controllers/dosen/kelas-kuliah.controller.js"

const router = Router();

router.get('/', kelasKuliahController.getKelasKuliah)

export default router;