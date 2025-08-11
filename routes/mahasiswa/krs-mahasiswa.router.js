import { Router } from "express";
import * as KrsMahasiswaController from "../../controllers/mahasiswa/krs-mahasiswa.controller.js"

const router = new Router();

router.get('/', KrsMahasiswaController.testEndpoint)

export default router;