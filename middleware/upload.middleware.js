import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import { BadRequestError } from '../utils/custom-error.js';

const ensureDir = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

export const createUploadMiddleware = (fieldConfigs) => {
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            const config = fieldConfigs.find(f => f.name === file.fieldname);
            if (!config) {
                return cb(new BadRequestError(`Field file tidak dikenali: ${file.fieldname}`), null);
            }
            // Use the destination from the config
            const dest = path.join('uploads', config.destination);
            ensureDir(dest);
            cb(null, dest);
        },
        filename: (req, file, cb) => {
            const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
            cb(null, uniqueName);
        },
    });

    const fileFilter = (req, file, cb) => {
        const config = fieldConfigs.find(f => f.name === file.fieldname);
        if (!config) return cb(new BadRequestError(`Field tidak terkonfigurasi.`), false);

        if (config.allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new BadRequestError(`Tipe file salah. Yang dibolehkan: ${config.allowedMimeTypes.join(', ')}`), false);
        }
    };

    const multerFields = fieldConfigs.map(f => ({ name: f.name, maxCount: f.maxCount }));

    // Ambil max size terbesar dari config atau default 20MB
    const maxFileSize = fieldConfigs.reduce((max, f) => Math.max(max, f.maxSize || 0), 0) || 20 * 1024 * 1024;

    return multer({
        storage: storage,
        fileFilter: fileFilter,
        limits: { fileSize: maxFileSize }, // Limit dinamis
    }).fields(multerFields);
};

export const createRequiredFieldsValidator = (requiredFields) => {
    return (req, res, next) => {
        const files = req.files;

        // A basic check to ensure req.files is an object.
        if (!files || typeof files !== 'object') {
            return res.status(400).json({
                message: `Validation failed: Required files are missing: ${requiredFields.join(', ')}`
            });
        }

        // Loop through the list of fields we expect to be required.
        for (const fieldName of requiredFields) {
            // Check if the field is missing from the files object OR if it's an empty array.
            if (!files[fieldName] || files[fieldName].length === 0) {
                return res.status(400).json({
                    message: `Validation failed: '${fieldName}' is a required field.`,
                });
            }
        }

        next();
    };
};