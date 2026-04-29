// import * as AturanEvaluasiService from '../../services/aturan-evaluasi.service.js';
// import ResponseBuilder from "../../utils/response.js";

// export const fetchAturanEvaluasi = async (req, res) => {
//     const responseBuilder = new ResponseBuilder(res);
//     try {
//         const { tahunKurikulumId, jenjangId } = req.params;
//         const data = await AturanEvaluasiService.getAturanEvaluasiList(tahunKurikulumId, jenjangId);
//         return responseBuilder.code(200).message("Berhasil mengambil data Aturan Evaluasi").json(data);
//     } catch (error) {
//         return responseBuilder.status("failure").code(500).message(error.message).json();
//     }
// };

// export const saveAturanEvaluasi = async (req, res) => {
//     const responseBuilder = new ResponseBuilder(res);
//     try {
//         const { tahunKurikulumId, jenjangId } = req.params;
//         const data = await AturanEvaluasiService.upsertAturanEvaluasi(tahunKurikulumId, jenjangId, req.body);
//         return responseBuilder.code(200).message("Berhasil menyimpan Aturan Evaluasi").json(data);
//     } catch (error) {
//         return responseBuilder.status("failure").code(500).message(error.message).json();
//     }
// };

// export const deleteAturanEvaluasi = async (req, res) => {
//     const responseBuilder = new ResponseBuilder(res);
//     try {
//         await AturanEvaluasiService.destroyAturanEvaluasi(req.params.id);
//         return responseBuilder.code(200).message("Berhasil menghapus Aturan Evaluasi").json();
//     } catch (error) {
//         return responseBuilder.status("failure").code(500).message(error.message).json();
//     }
// };

import * as AturanEvaluasiService from '../../services/aturan-evaluasi.service.js';
import ResponseBuilder from "../../utils/response.js";

export const fetchAturanEvaluasi = async (req, res, next) => {
    try {
        const { tahunKurikulumId, jenjangId } = req.query;
        const data = await AturanEvaluasiService.getAturanEvaluasiList(tahunKurikulumId, jenjangId);
        
        return new ResponseBuilder(res)
            .code(200)
            .message("Berhasil mengambil data Aturan Evaluasi")
            .json(data);
    } catch (error) { next(error); }
};

export const saveAturanEvaluasi = async (req, res, next) => {
    try {
        const data = await AturanEvaluasiService.upsertAturanEvaluasi(req.body);
        return new ResponseBuilder(res)
            .code(200)
            .message("Berhasil menyimpan data Aturan Evaluasi")
            .json(data);
    } catch (error) { next(error); }
};

export const deleteAturanEvaluasi = async (req, res, next) => {
    try {
        await AturanEvaluasiService.destroyAturanEvaluasi(req.params.id);
        return new ResponseBuilder(res)
            .code(200)
            .message("Berhasil menghapus data Aturan Evaluasi")
            .json();
    } catch (error) { next(error); }
};