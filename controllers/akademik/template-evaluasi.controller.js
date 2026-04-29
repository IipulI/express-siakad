// import * as TemplateService from "../../services/template-evaluasi.service.js";
// import ResponseBuilder from "../../utils/response.js"; // Kalau Abang pakai ResponseBuilder

// export const getListTemplate = async (req, res) => {
//     try {
//         // Tangkap semua filter dari URL
//         const filters = {
//             kurikulumId: req.query.kurikulumId,
//             prodiId: req.query.prodiId,
//             jenisMk: req.query.jenisMk,
//             search: req.query.search // Tangkapan Kotak Search
//         };

//         const data = await TemplateService.getListTemplate(filters);

//         return res.status(200).json({
//             status: 200,
//             message: "Berhasil mengambil daftar template evaluasi",
//             data: data,
//             errors: {}
//         });
//     } catch (error) {
//         return res.status(500).json({ status: 500, message: error.message, data: {}, errors: {} });
//     }
// };

// export const getDetailTemplate = async (req, res) => {
//     try {
//         const { kurikulumId, prodiId, jenisMk } = req.query; 
        
//         if (!kurikulumId || !prodiId || !jenisMk) {
//             return res.status(400).json({ status: 400, message: "Parameter kurikulumId, prodiId, dan jenisMk wajib diisi", data: {}, errors: {} });
//         }

//         const data = await TemplateService.getDetailTemplate(kurikulumId, prodiId, jenisMk);
        
//         if (!data) {
//              return res.status(404).json({ status: 404, message: "Detail template tidak ditemukan", data: {}, errors: {} });
//         }

//         return res.status(200).json({
//             status: 200,
//             message: "Berhasil mengambil detail template evaluasi",
//             data: data,
//             errors: {}
//         });
//     } catch (error) {
//         return res.status(500).json({ status: 500, message: error.message, data: {}, errors: {} });
//     }
// };

// export const saveTemplate = async (req, res) => {
//     try {
//         const payload = req.body; 

//         if (!payload.siakTahunKurikulumId || !payload.siakProgramStudiId || !payload.jenisMataKuliah) {
//             return res.status(400).json({ status: 400, message: "Data utama tidak lengkap", data: {}, errors: {} });
//         }

//         await TemplateService.upsertTemplate(payload);

//         return res.status(201).json({
//             status: 201,
//             message: "Template evaluasi berhasil disimpan",
//             data: payload,
//             errors: {}
//         });
//     } catch (error) {
//         return res.status(500).json({ status: 500, message: error.message, data: {}, errors: {} });
//     }
// };

// export const deleteTemplate = async (req, res) => {
//     try {
//         const { kurikulumId, prodiId, jenisMk } = req.query;

//         if (!kurikulumId || !prodiId || !jenisMk) {
//             return res.status(400).json({ status: 400, message: "Parameter kurikulumId, prodiId, dan jenisMk wajib diisi", data: {}, errors: {} });
//         }

//         const deletedCount = await TemplateService.deleteTemplate(kurikulumId, prodiId, jenisMk);

//         if (deletedCount === 0) {
//             return res.status(404).json({ status: 404, message: "Data template tidak ditemukan", data: {}, errors: {} });
//         }

//         return res.status(200).json({
//             status: 200,
//             message: "Berhasil menghapus template evaluasi",
//             data: { totalDihapus: deletedCount },
//             errors: {}
//         });
//     } catch (error) {
//         return res.status(500).json({ status: 500, message: error.message, data: {}, errors: {} });
//     }
// };

import * as TemplateService from "../../services/template-evaluasi.service.js";
import ResponseBuilder from "../../utils/response.js";

/**
 * Mendapatkan daftar template dengan pagination & grouping
 */
export const getListTemplate = async (req, res, next) => {
    try {
        const filters = {
            kurikulumId: req.query.kurikulumId,
            prodiId: req.query.prodiId,
            jenisMk: req.query.jenisMk,
            search: req.query.search,
            page: req.query.page,
            limit: req.query.limit
        };

        const data = await TemplateService.getListTemplate(filters);
        
        return new ResponseBuilder(res)
            .code(200)
            .message("Berhasil mengambil daftar template evaluasi")
            .json(data);
    } catch (error) { 
        next(error); 
    }
};

/**
 * Mendapatkan detail satu template (Komponen + Pelaporan)
 */
export const getDetailTemplate = async (req, res, next) => {
    try {
        const { kurikulumId, prodiId, jenisMk } = req.query;
        const data = await TemplateService.getDetailTemplate(kurikulumId, prodiId, jenisMk);
        
        return new ResponseBuilder(res)
            .code(200)
            .message("Berhasil mengambil detail template evaluasi")
            .json(data);
    } catch (error) { 
        next(error); 
    }
};

/**
 * Simpan massal (Wipe & Replace)
 */
export const saveTemplate = async (req, res, next) => {
    try {
        const data = await TemplateService.upsertTemplate(req.body);
        
        return new ResponseBuilder(res)
            .code(201)
            .message("Template evaluasi berhasil disimpan")
            .json(data);
    } catch (error) { 
        next(error); 
    }
};

/**
 * Hapus template berdasarkan kriteria header
 */
export const deleteTemplate = async (req, res, next) => {
    try {
        const { kurikulumId, prodiId, jenisMk } = req.query;
        await TemplateService.deleteTemplate(kurikulumId, prodiId, jenisMk);
        
        return new ResponseBuilder(res)
            .code(200)
            .message("Berhasil menghapus template evaluasi")
            .json();
    } catch (error) { 
        next(error); 
    }
};