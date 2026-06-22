import { Router } from "express";
import * as SistemKuliahController from "../../controllers/akademik/sistem-kuliah.controller.js";

const router = Router();

router.get('/', SistemKuliahController.findAll)
router.get('/:id', SistemKuliahController.findOneById)
router.post('/', SistemKuliahController.create)
router.put('/:id', SistemKuliahController.update)
router.delete('/:id', SistemKuliahController.destroy)

export default router;