// import * as predikatService from '../../services/predikat-kelulusan.service.js';
// import ResponseBuilder from "../../utils/response.js";

// export const fetchBulk = async (req, res, next) => {
//     try {
//         const { prodiId, tahunKurikulumId } = req.query;
//         const data = await predikatService.getPredikatWithHeader(prodiId, tahunKurikulumId);
        
//         return new ResponseBuilder(res)
//             .code(200)
//             .message("Data Predikat Kelulusan berhasil diambil")
//             .json(data);
//     } catch (error) { next(error); }
// };

// export const saveBulk = async (req, res, next) => {
//     try {
//         const result = await predikatService.upsertBulkPredikat(req.body);
        
//         return new ResponseBuilder(res)
//             .code(200)
//             .message("Data Predikat Kelulusan berhasil disimpan")
//             .json(result);
//     } catch (error) { next(error); }
// };

// // Method fetchAll, create, update, destroy lama Abang tetap dipertahankan di bawah...
// export const fetchAll = async (req, res) => {
//     const responseBuilder = new ResponseBuilder(res);
//     try {
//         const { tahunKurikulumId, jenjangId } = req.query;
        
//         // Validasi agar tidak mencari semua data sembarangan
//         if (!tahunKurikulumId || !jenjangId) {
//             throw new Error("Parameter tahunKurikulumId dan jenjangId wajib dikirim!");
//         }

//         const data = await predikatService.getPredikatKelulusan(tahunKurikulumId, jenjangId);
//         return responseBuilder.code(200).message("Berhasil mengambil data predikat kelulusan").json(data);
//     } catch (error) {
//         return responseBuilder.status("failure").code(500).message(error.message).json();
//     }
// };

// export const create = async (req, res) => {
//     const responseBuilder = new ResponseBuilder(res);
//     try {
//         await predikatService.createPredikatKelulusan(req.body);
//         return responseBuilder.code(201).message("Data Predikat Kelulusan berhasil ditambahkan").json();
//     } catch (error) {
//         return responseBuilder.status("failure").code(500).message(error.message).json();
//     }
// };

// export const update = async (req, res) => {
//     const responseBuilder = new ResponseBuilder(res);
//     const { id } = req.params;

//     try {
//         const isUpdated = await predikatService.updatePredikatKelulusan(id, req.body);
//         if (isUpdated) {
//             return responseBuilder.code(200).message("Data berhasil diperbarui").json();
//         } else {
//             return responseBuilder.status("failure").code(404).message(`Data dengan ID ${id} tidak ditemukan`).json();
//         }
//     } catch (error) {
//         return responseBuilder.status("failure").code(500).message(error.message).json();
//     }
// };

// export const destroy = async (req, res) => {
//     const responseBuilder = new ResponseBuilder(res);
//     const { id } = req.params;

//     try {
//         const isDeleted = await predikatService.deletePredikatKelulusan(id);
//         if (isDeleted) {
//             return responseBuilder.code(200).message("Data berhasil dihapus").json();
//         } else {
//             return responseBuilder.status("failure").code(404).message(`Data dengan ID ${id} tidak ditemukan`).json();
//         }
//     } catch (error) {
//         return responseBuilder.status("failure").code(500).message(error.message).json();
//     }
// };


// import * as predikatService from '../../services/predikat-kelulusan.service.js';
// import ResponseBuilder from "../../utils/response.js";

// // --- 1. FETCH BULK (Untuk Tabel Kurikulum Prodi) ---
// export const fetchBulk = async (req, res, next) => {
//     try {
//         const { prodiId, tahunKurikulumId } = req.query;
//         const data = await predikatService.getPredikatWithHeader(prodiId, tahunKurikulumId);
        
//         return new ResponseBuilder(res)
//             .code(200)
//             .message("Data Predikat Kelulusan berhasil diambil")
//             .json(data);
//     } catch (error) { 
//         next(error); 
//     }
// };

// // --- 2. SAVE BULK (Wipe & Replace dari UI) ---
// export const saveBulk = async (req, res, next) => {
//     try {
//         const result = await predikatService.upsertBulkPredikat(req.body);
        
//         return new ResponseBuilder(res)
//             .code(200)
//             .message("Data Predikat Kelulusan berhasil disimpan")
//             .json(result);
//     } catch (error) { 
//         next(error); 
//     }
// };

// // --- 3. FETCH ALL (General Listing) ---
// export const fetchAll = async (req, res, next) => {
//     try {
//         const { tahunKurikulumId, jenjangId } = req.query;
//         const data = await predikatService.getPredikatKelulusan(tahunKurikulumId, jenjangId);
        
//         return new ResponseBuilder(res)
//             .code(200)
//             .message("Berhasil mengambil data predikat kelulusan")
//             .json(data);
//     } catch (error) { 
//         next(error); 
//     }
// };

// // --- 4. CREATE INDIVIDUAL ---
// export const create = async (req, res, next) => {
//     try {
//         const data = await predikatService.createPredikatKelulusan(req.body);
//         return new ResponseBuilder(res)
//             .code(201)
//             .message("Data Predikat Kelulusan berhasil ditambahkan")
//             .json(data);
//     } catch (error) { 
//         next(error); 
//     }
// };

// // --- 5. UPDATE INDIVIDUAL ---
// export const update = async (req, res, next) => {
//     try {
//         const { id } = req.params;
//         await predikatService.updatePredikatKelulusan(id, req.body);
        
//         return new ResponseBuilder(res)
//             .code(200)
//             .message("Data berhasil diperbarui")
//             .json();
//     } catch (error) { 
//         next(error); 
//     }
// };

// // --- 6. DELETE INDIVIDUAL ---
// export const destroy = async (req, res, next) => {
//     try {
//         const { id } = req.params;
//         await predikatService.deletePredikatKelulusan(id);
        
//         return new ResponseBuilder(res)
//             .code(200)
//             .message("Data berhasil dihapus")
//             .json();
//     } catch (error) { 
//         next(error); 
//     }
// };
import * as PredikatService from '../../services/predikat-kelulusan.service.js';
import ResponseBuilder from "../../utils/response.js";

export const fetchPredikat = async (req, res, next) => {
    try {
        const data = await PredikatService.getPredikatWithHeader(req.query);
        return new ResponseBuilder(res).code(200).message("Berhasil mengambil data").json(data);
    } catch (error) { next(error); }
};

export const getDetail = async (req, res, next) => {
    try {
        const data = await PredikatService.getPredikatById(req.params.id);
        return new ResponseBuilder(res).code(200).message("Berhasil mengambil detail").json(data);
    } catch (error) { next(error); }
};

export const savePredikat = async (req, res, next) => {
    try {
        const payload = req.params.id ? { ...req.body, id: req.params.id } : req.body;
        const data = await PredikatService.createOrUpdate(payload);
        return new ResponseBuilder(res).code(200).message("Data berhasil disimpan").json(data);
    } catch (error) { next(error); }
};

export const deletePredikat = async (req, res, next) => {
    try {
        await PredikatService.deletePredikatKelulusan(req.params.id);
        return new ResponseBuilder(res).code(200).message("Berhasil dihapus").json();
    } catch (error) { next(error); }
};

export const fetchPratinjauSalinPredikat = async (req, res, next) => {
    try {
        const { jenjangIdAsal, tahunKurikulumIdAsal } = req.query;
        const data = await PredikatService.pratinjauSalinPredikat(jenjangIdAsal, tahunKurikulumIdAsal);
        return new ResponseBuilder(res).code(200).message("Pratinjau Predikat Kelulusan sumber").json(data);
    } catch (error) { next(error); }
};

export const postSalinPredikat = async (req, res, next) => {
    try {
        const data = await PredikatService.salinPredikat(req.body);
        return new ResponseBuilder(res).code(200).message(`Berhasil menyalin ${data.jumlahDisalin} baris Predikat Kelulusan`).json(data);
    } catch (error) { next(error); }
};