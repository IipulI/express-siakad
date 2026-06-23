import { Router } from "express";
import * as PengumumanController from "../../controllers/akademik/pengumuman.controller.js";
import { createUploadMiddleware, createRequiredFieldsValidator } from "../../middleware/upload.middleware.js";

const bannerAttachmentConfig = [
    {
        name: 'file',
        maxCount: 1,
        destination: 'pengumuman',
        allowedMimeTypes: ['image/jpeg', 'image/png'],
        maxSize: 1024 * 1024 * 10,
    }
]
const upploadMiddleware = createUploadMiddleware(bannerAttachmentConfig)
const validateFile = createRequiredFieldsValidator(['file'])

const router = Router();

router.get("/", PengumumanController.findAll);
router.get('/:id', PengumumanController.findOneById)

router.post("/",
    upploadMiddleware,
    validateFile,
    PengumumanController.create
)

router.put('/:id',
    upploadMiddleware,
    validateFile,
    PengumumanController.updatePengumuman
)

router.delete('/:id', PengumumanController.deletePengumuman)

export default router;