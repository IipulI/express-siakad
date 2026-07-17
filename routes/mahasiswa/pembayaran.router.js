import { Router } from 'express';
import * as pembayaranController from '../../controllers/mahasiswa/pembayaran.controller.js';

const router = new Router();

router.get('/card', pembayaranController.getPembayaran)
router.get('/tagihan-aktif', pembayaranController.getPembayaranAktif)
router.post('/notify-step-3', pembayaranController.notifyStep)

export default router;