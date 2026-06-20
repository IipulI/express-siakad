import * as mkKurikulumService from '../../services/mata-kuliah-kurikulum.service.js';
import ResponseBuilder from "../../utils/response.js";

// --- 1. GET REKAP DISTRIBUSI SKS ---
// export const fetchRekapDistribusiSks = async (req, res) => {
//     const responseBuilder = new ResponseBuilder(res);
//     try {
//         const { prodiId, tahunKurikulumId } = req.query;
        
//         if (!prodiId) {
//             throw new Error("Parameter prodiId wajib dikirim!");
//         }

//         // Bungkus parameter ke dalam objek filters
//         const filters = {
//             prodiId: prodiId,
//             tahunKurikulumId: tahunKurikulumId // Ini bisa undefined kalau FE milih "Semua Tahun Kurikulum"
//         };

//         const data = await mkKurikulumService.getRekapDistribusiSks(filters);
//         return responseBuilder.code(200).message("Berhasil mengambil rekap distribusi SKS").json(data);
//     } catch (error) {
//         return responseBuilder.status("failure").code(500).message(error.message).json();
//     }
// };
export const fetchRekapDistribusiSks = async (req, res, next) => {
    try {
        // jenjangId/prodiId/tahunKurikulumId semua opsional -- kalau ketiganya
        // kosong ("-- Semua --" di UI), tampilkan semua kombinasi (pagination
        // yang sudah ada di service tetap berlaku).
        const { jenjangId, prodiId, tahunKurikulumId, page, limit } = req.query;
        const filters = { jenjangId, prodiId, tahunKurikulumId, page, limit };

        const data = await mkKurikulumService.getRekapDistribusiSks(filters);
        
        return new ResponseBuilder(res)
            .code(200)
            .message("Berhasil mengambil rekap distribusi SKS")
            .json(data);
    } catch (error) {
        next(error);
    }
};
// --- 2. GET MATA KULIAH GROUP BY SEMESTER ---
export const fetchMataKuliahPerSemester = async (req, res, next) => {
    try {
        const { prodiId, tahunKurikulumId } = req.query;
        
        // Data yang kembali sudah berupa { header, semesterData }
        const data = await mkKurikulumService.getMataKuliahPerSemester(prodiId, tahunKurikulumId);

        return new ResponseBuilder(res)
            .code(200)
            .message("Berhasil mengambil daftar mata kuliah per semester")
            .json(data);
    } catch (error) { 
        next(error); 
    }
};

// --- 3. GET DETAIL MATA KULIAH & PRASYARAT ---
export const fetchDetailMataKuliah = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    try {
        const { id } = req.params;
        const data = await mkKurikulumService.getDetailMataKuliah(id);
        return responseBuilder.code(200).message("Berhasil mengambil detail mata kuliah").json(data);
    } catch (error) {
        return responseBuilder.status("failure").code(500).message(error.message).json();
    }
};

// // --- 4. CREATE: Tambah MK ke Semester (Tombol + Tambah) ---
// export const addMataKuliahKeKurikulum = async (req, res) => {
//     const responseBuilder = new ResponseBuilder(res);
//     try {
//         const { mataKuliahId, semester, nilaiMin, statusMk } = req.body;
        
//         if (!mataKuliahId || !semester) {
//             throw new Error("Mata Kuliah dan Semester wajib diisi!");
//         }

//         const data = await mkKurikulumService.assignMataKuliah(mataKuliahId, req.body);
//         return responseBuilder.code(200).message("Berhasil menambahkan Mata Kuliah ke Semester").json(data);
//     } catch (error) {
//         return responseBuilder.status("failure").code(500).message(error.message).json();
//     }
// };

// // --- 5. UPDATE: Ubah Data (Tombol Ubah Data) ---
// export const updateDetailMataKuliah = async (req, res) => {
//     const responseBuilder = new ResponseBuilder(res);
//     try {
//         const { id } = req.params;
//         const payload = req.body; 

//         const data = await mkKurikulumService.updateMataKuliahKurikulum(id, payload);
//         return responseBuilder.code(200).message("Berhasil mengubah data Mata Kuliah").json(data);
//     } catch (error) {
//         return responseBuilder.status("failure").code(500).message(error.message).json();
//     }
// };
export const addMataKuliahKeKurikulum = async (req, res, next) => {
    try {
        const data = await mkKurikulumService.assignMataKuliah(req.body.mataKuliahId, req.body);
        return new ResponseBuilder(res).code(200).message("Berhasil menambahkan Mata Kuliah ke Semester").json(data);
    } catch (error) { next(error); }
};

export const updateDetailMataKuliah = async (req, res, next) => {
    try {
        const data = await mkKurikulumService.updateMataKuliahKurikulum(req.params.id, req.body);
        return new ResponseBuilder(res).code(200).message("Berhasil mengubah data Mata Kuliah").json(data);
    } catch (error) { next(error); }
};

export const deleteMataKuliahKurikulum = async (req, res, next) => {
    try {
        await mkKurikulumService.removeMataKuliah(req.params.id);
        return new ResponseBuilder(res).code(200).message("Berhasil menghapus Mata Kuliah").json({});
    } catch (error) { next(error); }
};

export const fetchPratinjauSalinMataKuliahKurikulum = async (req, res, next) => {
    try {
        const { prodiId, tahunKurikulumIdAsal } = req.query;
        const data = await mkKurikulumService.pratinjauSalinMataKuliahKurikulum(prodiId, tahunKurikulumIdAsal);
        return new ResponseBuilder(res).code(200).message("Pratinjau Mata Kuliah Kurikulum sumber").json(data);
    } catch (error) { next(error); }
};

export const postSalinMataKuliahKurikulum = async (req, res, next) => {
    try {
        const data = await mkKurikulumService.salinMataKuliahKurikulum(req.body);
        return new ResponseBuilder(res).code(200).message(`Berhasil menyalin ${data.jumlahDisalin} Mata Kuliah`).json(data);
    } catch (error) { next(error); }
};
// --- 6. DELETE: Hapus Data (Tombol Tong Sampah) ---
// export const deleteMataKuliahKurikulum = async (req, res) => {
//     const responseBuilder = new ResponseBuilder(res);
//     try {
//         const { id } = req.params;
//         await mkKurikulumService.removeMataKuliah(id);
//         return responseBuilder.code(200).message("Berhasil menghapus Mata Kuliah dari Kurikulum").json({});
//     } catch (error) {
//         return responseBuilder.status("failure").code(500).message(error.message).json();
//     }
// };
// --- 7. GET DROPDOWN PRASYARAT ---
export const fetchDropdownPrasyarat = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    try {
        const { prodiId, tahunKurikulumId } = req.query;
        if (!prodiId || !tahunKurikulumId) throw new Error("Parameter prodiId dan tahunKurikulumId wajib dikirim!");

        const data = await mkKurikulumService.getDropdownPrasyarat(prodiId, tahunKurikulumId);
        return responseBuilder.code(200).message("Berhasil mengambil data dropdown prasyarat").json(data);
    } catch (error) {
        return responseBuilder.status("failure").code(500).message(error.message).json();
    }
};
// --- 8. GET DROPDOWN KONSENTRASI ---
export const fetchDropdownKonsentrasi = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    try {
        const { prodiId } = req.query;
        if (!prodiId) throw new Error("Parameter prodiId wajib dikirim!");

        const data = await mkKurikulumService.getDropdownKonsentrasi(prodiId);
        return responseBuilder.code(200).message("Berhasil mengambil data dropdown konsentrasi").json(data);
    } catch (error) {
        return responseBuilder.status("failure").code(500).message(error.message).json();
    }
};