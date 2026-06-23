import { Router } from "express";
import { findAll as getAllFakultas } from "../controllers/akademik/fakultas.controller.js";
import { findAll as getAllProdi } from "../controllers/akademik/program-studi.controller.js";
import { findAll as getAllMataKuliah } from "../controllers/akademik/mata-kuliah.controller.js";
import { findAll as getAllKelasKuliah } from "../controllers/akademik/kelas-kuliah.controller.js";
import { fetchAllDosen, fetchExport } from "../controllers/public.controller.js";

const router = new Router()

router.get('/', fetchExport)

router.get('/mata-kuliah', getAllMataKuliah)
router.get('/kelas-kuliah', getAllKelasKuliah)
router.get('/dosen', fetchAllDosen)
// router.get('/jadwal-kuliah')
router.get('/program-studi', getAllProdi)
router.get('/fakultas', getAllFakultas)
// router.get('/periode-akademik')

export default router