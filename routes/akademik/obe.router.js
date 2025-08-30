import { Router } from "express";
import * as ObeController from '../../controllers/akademik/obe.controller.js'

const router = new Router();

router.get('/:obeId/profil-lulusan', ObeController.getProfilLulusan)
router.post('/:obeId/profil-lulusan', ObeController.createProfilLulusan)
router.put('/:obeId/profil-lulusan/:plId', ObeController.updateProfilLulusan)
router.delete('/:obeId/profil-lulusan/:plId', ObeController.deleteProfilLulusan)

router.get('/:obeId/capaian-pembelajaran-lulusan', ObeController.getCapaianPembelajaranLulusan)
router.post('/:obeId/capaian-pembelajaran-lulusan', ObeController.createCapaianPembelajaranLulusan)
router.put('/:obeId/capaian-pembelajaran-lulusan/:cplId', ObeController.updateCapaianPembelajaraanLulusan)
router.delete('/:obeId/capaian-pembelajaran-lulusan/:cplId', ObeController.deleteCapaianPembelajaranLulusan)

router.get('/:obeId/mata-kuliah/:mataKuliahId/capaian-mata-kuliah', ObeController.getCapaianMataKuliah)
router.post('/:obeId/mata-kuliah/:mataKuliahId/capaian-mata-kuliah', ObeController.createCapaianMataKuliah)
router.put('/:obeId/mata-kuliah/:mataKuliahId/capaian-mata-kuliah/:cpmkId', ObeController.updateCapaianMataKuliah)
router.delete('/:obeId/mata-kuliah/:mataKuliahId/capaian-mata-kuliah/:cpmkId', ObeController.deleteCapaianMataKuliah)

export default router;