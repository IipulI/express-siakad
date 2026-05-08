import { Router } from "express";
import pembimbingAkademikRouter from './pembimbing-akademik.router.js'

const router = Router();

router.use('/pembimbing-akademik', pembimbingAkademikRouter)

export default router;