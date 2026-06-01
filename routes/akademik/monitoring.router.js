import { Router } from "express";
import * as MonitoringController from '../../controllers/akademik/monitoring.controller.js';

const router = new Router();

// =====================================================================
// MONITORING OBE
// =====================================================================
// 1. CPL per Program Studi (Data JSON untuk Frontend/Chart)
router.get('/cpl-prodi', MonitoringController.getMonitoringCplProdi);


export default router;