// import * as KurikulumProdiService from '../../services/kurikulum-prodi.service.js'
// import ResponseBuilder from "../../utils/response.js";

// export const fetchKurikulumProdi = async (req, res) => {
//     const programStudiId = req.query.siakProgramStudiId
//     const tahunKurikulumId = req.query.siakTahunKurikulumId

//     if (!programStudiId || !tahunKurikulumId) {
//         throw new Error(`Program Studi dan Tahun Kurikulum wajib diisi`)
//     }

//     const responseBuilder = new ResponseBuilder(res);

//     try {
//         const courses = await KurikulumProdiService.fetchKurikulumProdi(programStudiId, tahunKurikulumId)

//         const coursesGroupedBySemester = courses.reduce((acc, course) => {
//             const { semester, totalSks } = course;
//             if (!acc[semester]) {
//                 acc[semester] = {
//                     semester,
//                     mataKuliah: [],
//                     totalSks: 0,
//                 };
//             }
//             acc[semester].totalSks += totalSks

//             acc[semester].mataKuliah.push(course);
//             return acc;
//         }, {});

//         const finalResponse = Object.values(coursesGroupedBySemester);

//         return  responseBuilder
//             .code(200)
//             .message("Data berhasil diambil")
//             .json(finalResponse)
//     }
//     catch (error) {
//         return responseBuilder
//             .status("failure")
//             .code(500)
//             .message(error.message || 'Terjadi kesalahan tak terduga.')
//             .json();
//     }
// }

// export const addCourseToKurikulumProdi = async (req, res) => {
//     const responseBuilder = new ResponseBuilder(res);
//     const id = req.params.id;

//     try {
//         await KurikulumProdiService.addCourseToKurikulumProdi(id, req.body)

//         return responseBuilder
//             .code(200)
//             .message("Data berhasil diperbarui")
//             .json();
//     }
//     catch (error) {
//         return responseBuilder
//             .status("failure")
//             .code(500)
//             .message(error.message || 'Terjadi kesalahan tak terduga')
//             .json();
//     }
// }

// export const deleteCourseFromKurikulumProdi = async (req, res) => {
//     const responseBuilder = new ResponseBuilder(res);
//     const id = req.params.id;

//     try {
//         await KurikulumProdiService.deleteCourseFromKurikulumProdi(id)

//         return responseBuilder
//             .status('success')
//             .code(200)
//             .message("Data berhasil diperbarui")
//             .json();
//     }
//     catch (error) {
//         return responseBuilder
//             .status('failure')
//             .code(500)
//             .message(error.message)
//             .json()
//     }
// }
import * as kurikulumProdiService from '../../services/kurikulum-prodi.service.js';
import ResponseBuilder from "../../utils/response.js";

// 1. GET: Rekap Tahun Kurikulum (Untuk halaman paling depan)
export const fetchRekapTahunKurikulum = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    try {
        const data = await kurikulumProdiService.getRekapTahunKurikulum();
        return responseBuilder.code(200).message("Berhasil mengambil rekap tahun kurikulum").json(data);
    } catch (error) {
        return responseBuilder.status("failure").code(500).message(error.message).json();
    }
};

// 2. GET: Daftar Prodi & Status OBE (Tab Jenis Kurikulum)
export const fetchListProdi = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    try {
        const { tahunKurikulumId, jenjangId } = req.query;
        
        // Validasi parameter URL
        if (!tahunKurikulumId || !jenjangId) {
            throw new Error("Parameter tahunKurikulumId dan jenjangId wajib dikirim!");
        }
        
        const data = await kurikulumProdiService.getDaftarKurikulumProdi(tahunKurikulumId, jenjangId);
        return responseBuilder.code(200).message("Berhasil mengambil daftar prodi dan status kurikulum").json(data);
    } catch (error) {
        return responseBuilder.status("failure").code(500).message(error.message).json();
    }
};

// 3. POST: Set Aturan OBE & Target Capaian (Modal Checkbox)
export const updateAturanObe = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    try {
        const { programStudiId, tahunKurikulumId, isObe } = req.body;

        // Validasi body: isObe harus ada (bisa true/false), id prodi dan kurikulum wajib ada
        if (!programStudiId || !tahunKurikulumId || isObe === undefined) {
            throw new Error("Parameter programStudiId, tahunKurikulumId, dan isObe wajib dikirim!");
        }
        
        // Lempar seluruh isi req.body ke service
        const message = await kurikulumProdiService.setAturanObeProdi(req.body);
        
        return responseBuilder.code(200).message(message).json();
    } catch (error) {
        return responseBuilder.status("failure").code(500).message(error.message).json();
    }
};
// // 4. PREDIKAT KELULUSAN
// export const fetchPredikat = async (req, res) => {
//     const responseBuilder = new ResponseBuilder(res);
//     try {
//         const data = await kurikulumProdiService.fetchPredikatKelulusan();
//         return responseBuilder.code(200).message("Data Predikat berhasil diambil").json(data);
//     } catch (error) {å
//         return responseBuilder.status("failure").code(500).message(error.message).json();
//     }
// };

// export const savePredikat = async (req, res) => {
//     const responseBuilder = new ResponseBuilder(res);
//     try {
//         await kurikulumProdiService.upsertPredikatKelulusan(req.body);
//         return responseBuilder.code(200).message("Data Predikat berhasil disimpan").json();
//     } catch (error) {
//         return responseBuilder.status("failure").code(500).message(error.message).json();
//     }
// };

// export const destroyPredikat = async (req, res) => {
//     const responseBuilder = new ResponseBuilder(res);
//     try {
//         await kurikulumProdiService.deletePredikatKelulusan(req.params.id);
//         return responseBuilder.code(200).message("Data Predikat berhasil dihapus").json();
//     } catch (error) {
//         return responseBuilder.status("failure").code(500).message(error.message).json();
//     }
// };