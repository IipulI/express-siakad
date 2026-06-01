// import * as ekivalensiService from '../../services/ekivalensi-mata-kuliah.service.js';
// import ResponseBuilder from "../../utils/response.js";

// export const fetchListEkivalensi = async (req, res) => {
//     const responseBuilder = new ResponseBuilder(res);
//     try {
//         const { prodiId, kurikulumBaruId, kurikulumLamaId } = req.query;
//         const data = await ekivalensiService.getListEkivalensi(prodiId, kurikulumBaruId, kurikulumLamaId);
//         return responseBuilder.code(200).message("Berhasil mengambil data Ekivalensi").json(data);
//     } catch (error) {
//         return responseBuilder.status("failure").code(500).message(error.message).json();
//     }
// };

// export const fetchDropdownMkLama = async (req, res) => {
//     const responseBuilder = new ResponseBuilder(res);
//     try {
//         const { prodiId, kurikulumLamaId } = req.query;
//         const data = await ekivalensiService.getDropdownMkLama(prodiId, kurikulumLamaId);
//         return responseBuilder.code(200).message("Berhasil mengambil dropdown MK Lama").json(data);
//     } catch (error) {
//         return responseBuilder.status("failure").code(500).message(error.message).json();
//     }
// };

// // --- POST/PUT: SIMPAN MASSAL ---
// export const saveBulkEkivalensi = async (req, res) => {
//     const responseBuilder = new ResponseBuilder(res);
//     try {
//         // Body: { dataEkivalensi: [ {mkBaruId, mkLamaId}, ... ] }
//         const result = await ekivalensiService.bulkSaveEkivalensi(req.body);
//         return responseBuilder.code(200).message("Berhasil menyimpan data Ekivalensi").json(result);
//     } catch (error) {
//         return responseBuilder.status("failure").code(500).message(error.message).json();
//     }
// };

// // --- DELETE: HAPUS MAPPING ---
// export const deleteEkivalensiByMk = async (req, res) => {
//     const responseBuilder = new ResponseBuilder(res);
//     try {
//         const { mkBaruId } = req.params;
//         await ekivalensiService.removeEkivalensi(mkBaruId);
//         return responseBuilder.code(200).message("Berhasil menghapus mapping ekivalensi").json();
//     } catch (error) {
//         return responseBuilder.status("failure").code(500).message(error.message).json();
//     }
// };
import * as ekivalensiService from '../../services/ekivalensi-mata-kuliah.service.js';
import ResponseBuilder from "../../utils/response.js";

export const fetchListEkivalensi = async (req, res, next) => {
    try {
        const { prodiId, kurikulumBaruId, kurikulumLamaId } = req.query;
        const data = await ekivalensiService.getListEkivalensi(prodiId, kurikulumBaruId, kurikulumLamaId);
        return new ResponseBuilder(res).code(200).message("Berhasil mengambil data Ekivalensi").json(data);
    } catch (error) { next(error); }
};

export const fetchDropdownMkLama = async (req, res, next) => {
    try {
        const { prodiId, kurikulumLamaId } = req.query;
        const data = await ekivalensiService.getDropdownMkLama(prodiId, kurikulumLamaId);
        return new ResponseBuilder(res).code(200).message("Berhasil mengambil dropdown MK Lama").json(data);
    } catch (error) { next(error); }
};

export const saveBulkEkivalensi = async (req, res, next) => {
    try {
        const result = await ekivalensiService.bulkSaveEkivalensi(req.body);
        return new ResponseBuilder(res).code(200).message("Berhasil menyimpan data Ekivalensi").json(result);
    } catch (error) { next(error); }
};

export const deleteEkivalensiByMk = async (req, res, next) => {
    try {
        await ekivalensiService.removeEkivalensi(req.params.mkBaruId);
        return new ResponseBuilder(res).code(200).message("Berhasil menghapus mapping ekivalensi").json();
    } catch (error) { next(error); }
};