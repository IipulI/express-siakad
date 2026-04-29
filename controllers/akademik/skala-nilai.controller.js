// import * as skalaNilaiService from '../../services/skala-nilai.service.js';
// import ResponseBuilder from "../../utils/response.js";

// export const fetchSkalaNilai = async (req, res) => {
//     const responseBuilder = new ResponseBuilder(res);
//     try {
//         const { programStudiId, tahunKurikulumId } = req.query;
//         if (!programStudiId || !tahunKurikulumId) {
//             throw new Error("Parameter programStudiId dan tahunKurikulumId wajib diisi");
//         }
//         const data = await skalaNilaiService.getSkalaNilaiByProdi(programStudiId, tahunKurikulumId);
//         return responseBuilder.code(200).message("Data Skala Nilai berhasil diambil").json(data);
//     } catch (error) {
//         return responseBuilder.status("failure").code(500).message(error.message).json();
//     }
// };

// export const saveSkalaNilai = async (req, res) => {
//     const responseBuilder = new ResponseBuilder(res);
//     try {
//         const data = await skalaNilaiService.upsertSkalaNilai(req.body);
//         return responseBuilder.code(200).message("Data Skala Nilai berhasil disimpan").json(data);
//     } catch (error) {
//         return responseBuilder.status("failure").code(500).message(error.message).json();
//     }
// };

// export const destroySkalaNilai = async (req, res) => {
//     const responseBuilder = new ResponseBuilder(res);
//     try {
//         await skalaNilaiService.deleteSkalaNilai(req.params.id);
//         return responseBuilder.code(200).message("Data Skala Nilai berhasil dihapus").json();
//     } catch (error) {
//         return responseBuilder.status("failure").code(500).message(error.message).json();
//     }
// };
// import * as skalaNilaiService from '../../services/skala-nilai.service.js';
// import ResponseBuilder from "../../utils/response.js";

// export const fetchSkalaNilai = async (req, res) => {
//     const responseBuilder = new ResponseBuilder(res);
//     try {
//         // Tangkap periodeId dari query (bisa undefined/kosong jika pilih 'Periode Awal Kurikulum')
//         const { programStudiId, tahunKurikulumId, periodeId } = req.query;
        
//         if (!programStudiId || !tahunKurikulumId) {
//             throw new Error("Parameter programStudiId dan tahunKurikulumId wajib diisi");
//         }

//         // Lempar periodeId ke Service
//         const data = await skalaNilaiService.getSkalaNilaiByProdi(programStudiId, tahunKurikulumId, periodeId);
//         return responseBuilder.code(200).message("Data Skala Nilai berhasil diambil").json(data);
//     } catch (error) {
//         return responseBuilder.status("failure").code(500).message(error.message).json();
//     }
// };
// export const saveSkalaNilai = async (req, res) => {
//     const responseBuilder = new ResponseBuilder(res);
//     try {
//         // Validasi dasar untuk memastikan payload dari Frontend dikirim dalam format Bulk (Array)
//         const { programStudiId, tahunKurikulumId, dataSkala } = req.body;
        
//         if (!programStudiId || !tahunKurikulumId || !Array.isArray(dataSkala)) {
//             throw new Error("Format tidak valid! Pastikan mengirim programStudiId, tahunKurikulumId, dan array dataSkala.");
//         }

//         const data = await skalaNilaiService.upsertSkalaNilai(req.body);
//         return responseBuilder.code(200).message("Data Skala Nilai massal berhasil disimpan").json(data);
//     } catch (error) {
//         return responseBuilder.status("failure").code(500).message(error.message).json();
//     }
// };

// export const destroySkalaNilai = async (req, res) => {
//     const responseBuilder = new ResponseBuilder(res);
//     try {
//         await skalaNilaiService.deleteSkalaNilai(req.params.id);
//         return responseBuilder.code(200).message("Data Skala Nilai berhasil dihapus").json();
//     } catch (error) {
//         return responseBuilder.status("failure").code(500).message(error.message).json();
//     }
// };
import * as skalaNilaiService from '../../services/skala-nilai.service.js';
import ResponseBuilder from "../../utils/response.js";
import * as CustomError from "../../utils/custom-error.js";

export const fetchSkalaNilai = async (req, res, next) => {
    try {
        const { programStudiId, jenjangId, tahunKurikulumId, periodeId } = req.query;

        // Pengecekan: Minimal harus ngirim salah satu (Prodi atau Jenjang)
        if (!programStudiId && !jenjangId) {
            throw new CustomError.BadRequestError("Pilih salah satu: programStudiId atau jenjangId wajib dikirim!");
        }

        const data = await skalaNilaiService.getSkalaNilaiList({ programStudiId, jenjangId, tahunKurikulumId, periodeId });
        
        return new ResponseBuilder(res)
            .code(200)
            .message("Data Skala Nilai berhasil diambil")
            .json(data);
    } catch (error) { next(error); }
};

export const saveSkalaNilai = async (req, res, next) => {
    try {
        const data = await skalaNilaiService.upsertSkalaNilai(req.body);
        
        return new ResponseBuilder(res)
            .code(200)
            .message("Data Skala Nilai massal berhasil disimpan")
            .json(data);
    } catch (error) { next(error); }
};

export const destroySkalaNilai = async (req, res, next) => {
    try {
        await skalaNilaiService.deleteSkalaNilai(req.params.id);
        
        return new ResponseBuilder(res)
            .code(200)
            .message("Data Skala Nilai berhasil dihapus")
            .json();
    } catch (error) { next(error); }
};