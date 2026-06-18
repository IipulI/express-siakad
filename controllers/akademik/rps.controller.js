import * as rpsService from "../../services/rps.service.js";
import ResponseBuilder from "../../utils/response.js";

// =========================================================
// CONTROLLER: Pratinjau Salin Detail RPS
// =========================================================
export const pratinjauSalinDetailRps = async (req, res, next) => {
    try {
        const { mataKuliahId } = req.params;
        const { periodeAsalId } = req.query;
        const data = await rpsService.pratinjauSalinDetailRps(mataKuliahId, periodeAsalId);

        return new ResponseBuilder(res)
            .code(200)
            .message("Pratinjau Detail RPS periode asal")
            .json(data);
    } catch (error) {
        next(error);
    }
};

// =========================================================
// CONTROLLER: Salin Detail RPS antar Periode
// =========================================================
export const salinDetailRps = async (req, res, next) => {
    try {
        const { mataKuliahId } = req.params;
        const { periodeAsalId, periodeTujuanId } = req.body;
        const data = await rpsService.salinDetailRps(mataKuliahId, periodeAsalId, periodeTujuanId);

        return new ResponseBuilder(res)
            .code(200)
            .message("Detail RPS berhasil disalin")
            .json(data);
    } catch (error) {
        next(error);
    }
};

// =========================================================
// CONTROLLER: Ambil Data UI Detail RPS (Dengan fitur copy periode)
// =========================================================
export const getFormDetailRps = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    const { mataKuliahId } = req.params;
    // Query param untuk fitur "Salin Data" atau memilih dropdown periode
    const { periodeId } = req.query; 

    try {
        const data = await rpsService.getFormDetailRps(mataKuliahId, periodeId);
        
        return responseBuilder
            .status("success")
            .code(200)
            .message("Berhasil mengambil data form Detail RPS")
            .json(data); 
    } catch (error) {
        return responseBuilder
            .status("failure")
            .code(500)
            .message(error.message)
            .json();
    }
};

// =========================================================
// CONTROLLER: Simpan Data Detail RPS
// =========================================================
// export const saveDetailRps = async (req, res) => {
//     const responseBuilder = new ResponseBuilder(res);
//     const { mataKuliahId } = req.params;

//     try {
//         // req.body harus mengandung siakPeriodeAkademikId
//         const result = await rpsService.upsertDetailRps(mataKuliahId, req.body, req.file);

//         return responseBuilder
//             .status("success")
//             .code(result.isNewRecord ? 201 : 200)
//             .message(result.isNewRecord ? "Berhasil membuat Detail RPS baru" : "Berhasil memperbarui Detail RPS")
//             .json(result.data);
//     } catch (error) {
//         return responseBuilder
//             .status("failure")
//             .code(500)
//             .message(error.message)
//             .json();
//     }
// };
export const saveDetailRps = async (req, res, next) => {
    try {
        const { mataKuliahId } = req.params;
        const result = await rpsService.upsertDetailRps(mataKuliahId, req.body, req.file);

        return new ResponseBuilder(res)
            .code(result.isNewRecord ? 201 : 200)
            .message("Data Detail RPS berhasil disimpan")
            .json(result.data);
    } catch (error) {
        next(error); // 👈 File otomatis dihapus oleh Middleware jika error
    }
};

export const deleteDetailRps = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    const { id } = req.params; // Menggunakan ID RPS langsung

    try {
        const success = await rpsService.deleteDetailRps(id);
        if (success) {
            return responseBuilder.status("success").code(200).message("Berhasil menghapus Detail RPS").json();
        } else {
            return responseBuilder.status("failure").code(404).message("Data Detail RPS tidak ditemukan").json();
        }
    } catch (error) {
        return responseBuilder.status("failure").code(500).message(error.message).json();
    }
};

// --- Rencana Pembelajaran Controllers ---
// export const getRencanaPembelajaran = async (req, res) => {
//     const responseBuilder = new ResponseBuilder(res);
//     const { mataKuliahId } = req.params;
//     const { periodeId } = req.query; // Tangkap periodeId dari Query URL

//     try {
//         const data = await rpsService.getRencanaPembelajaran(mataKuliahId, periodeId);
//         return responseBuilder.status("success").code(200).message("Berhasil mengambil data Rencana Pembelajaran").json(data);
//     } catch (error) {
//         return responseBuilder.status("failure").code(500).message(error.message).json();
//     }
// };
export const getRencanaPembelajaran = async (req, res, next) => {
    try {
        const data = await rpsService.getRencanaPembelajaran(req.params.mataKuliahId, req.query.periodeId);
        return new ResponseBuilder(res).code(200).message("Berhasil mengambil data Rencana Pembelajaran").json(data);
    } catch (error) { next(error); }
};

// export const createRencanaPembelajaran = async (req, res) => {
//     const responseBuilder = new ResponseBuilder(res);
//     try {
//         const data = await rpsService.createRencanaPembelajaran(req.params.mataKuliahId, req.body);
//         return responseBuilder.status("success").code(201).message("Sesi pembelajaran berhasil ditambahkan").json(data);
//     } catch (error) {
//         return responseBuilder.status("failure").code(500).message(error.message).json();
//     }
// };


// export const createRencanaPembelajaran = async (req, res, next) => {
//     try {
//         const data = await rpsService.createRencanaPembelajaran(req.params.mataKuliahId, req.body);
//         return new ResponseBuilder(res)
//             .code(201)
//             .message("Sesi pembelajaran berhasil ditambahkan")
//             .json(data);
//     } catch (error) {
//         next(error);
//     }
// };



// export const updateRencanaPembelajaran = async (req, res) => {
//     const responseBuilder = new ResponseBuilder(res);
//     try {
//         const result = await rpsService.updateRencanaPembelajaran(req.params.id, req.body);
//         if (result) return responseBuilder.status("success").code(200).message("Sesi pembelajaran berhasil diupdate").json(result);
//         return responseBuilder.status("failure").code(404).message("Data tidak ditemukan").json();
//     } catch (error) {
//         return responseBuilder.status("failure").code(500).message(error.message).json();
//     }
// };
export const createRencanaPembelajaran = async (req, res, next) => {
    try {
        const data = await rpsService.createRencanaPembelajaran(req.params.mataKuliahId, req.body);
        return new ResponseBuilder(res).code(201).message("Detail Rencana Pembelajaran berhasil disimpan").json(data);
    } catch (error) { next(error); }
};

export const updateRencanaPembelajaran = async (req, res, next) => {
    try {
        await rpsService.updateRencanaPembelajaran(req.params.id, req.body, req.params.mataKuliahId);
        return new ResponseBuilder(res).code(200).message("Detail Rencana Pembelajaran berhasil diperbarui").json({});
    } catch (error) { next(error); }
};

export const deleteRencanaPembelajaran = async (req, res, next) => {
    try {
        await rpsService.deleteRencanaPembelajaran(req.params.id);
        return new ResponseBuilder(res).code(200).message("Sesi berhasil dihapus").json({});
    } catch (error) { next(error); }
};


// ==========================================
// --- BAGIAN RENCANA EVALUASI (HALAMAN 8) ---
// ==========================================
export const getRencanaEvaluasi = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    const { mataKuliahId } = req.params;
    const { periodeId } = req.query;
    try {
        const data = await rpsService.getRencanaEvaluasi(mataKuliahId, periodeId);
        return responseBuilder.status("success").code(200).message("Berhasil mengambil data evaluasi").json(data);
    } catch (error) {
        return responseBuilder.status("failure").code(500).message(error.message).json();
    }
};

// export const saveRencanaEvaluasi = async (req, res) => {
//     const responseBuilder = new ResponseBuilder(res);
//     const { mataKuliahId } = req.params;
//     try {
//         const data = await rpsService.upsertRencanaEvaluasi(mataKuliahId, req.body);
//         return responseBuilder.status("success").code(200).message("Data evaluasi berhasil disimpan").json(data);
//     } catch (error) {
//         return responseBuilder.status("failure").code(400).message(error.message).json();
//     }
// };



export const saveRencanaEvaluasiList = async (req, res, next) => {
    try {
        const { mataKuliahId } = req.params;
        const { siakPeriodeAkademikId } = req.body;
        
        // 1. Simpan rencana evaluasi
        await rpsService.saveRencanaEvaluasi(mataKuliahId, req.body);
        
        // 2. Tarik ulang data yang baru saja disimpan untuk ditampilkan di response
        const result = await rpsService.getRencanaEvaluasi(mataKuliahId, siakPeriodeAkademikId);
        
        return new ResponseBuilder(res)
            .code(200)
            .message("Komponen Evaluasi berhasil disimpan dan divalidasi!")
            .json(result);
    } catch (error) {
        next(error);
    }
};
export const deleteRencanaEvaluasi = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    try {
        await rpsService.deleteRencanaEvaluasi(req.params.id);
        return responseBuilder.status("success").code(200).message("Berhasil menghapus data evaluasi").json();
    } catch (error) {
        return responseBuilder.status("failure").code(500).message(error.message).json();
    }
};

export const getLaporanRpsCetak = async (req, res, next) => {
    try {
        const { mataKuliahId } = req.params;
        const { periodeId } = req.query;
        const data = await rpsService.getLaporanRpsCetak(mataKuliahId, periodeId || null);

        return new ResponseBuilder(res)
            .code(200)
            .message("Berhasil mengambil data laporan cetak RPS")
            .json(data);
    } catch (error) {
        next(error);
    }
};