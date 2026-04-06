import * as rpsService from "../../services/rps.service.js";
import ResponseBuilder from "../../utils/response.js";

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
export const saveDetailRps = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    const { mataKuliahId } = req.params;

    try {
        // req.body harus mengandung siakPeriodeAkademikId
        const result = await rpsService.upsertDetailRps(mataKuliahId, req.body, req.file);

        return responseBuilder
            .status("success")
            .code(result.isNewRecord ? 201 : 200)
            .message(result.isNewRecord ? "Berhasil membuat Detail RPS baru" : "Berhasil memperbarui Detail RPS")
            .json(result.data);
    } catch (error) {
        return responseBuilder
            .status("failure")
            .code(500)
            .message(error.message)
            .json();
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
export const getRencanaPembelajaran = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    try {
        const data = await rpsService.getRencanaPembelajaran(req.params.mataKuliahId);
        return responseBuilder.status("success").code(200).message("Berhasil mengambil data").json(data);
    } catch (error) {
        return responseBuilder.status("failure").code(500).message(error.message).json();
    }
};

export const createRencanaPembelajaran = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    try {
        const data = await rpsService.createRencanaPembelajaran(req.params.mataKuliahId, req.body);
        return responseBuilder.status("success").code(201).message("Sesi pembelajaran berhasil ditambahkan").json(data);
    } catch (error) {
        return responseBuilder.status("failure").code(500).message(error.message).json();
    }
};

export const updateRencanaPembelajaran = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    try {
        const result = await rpsService.updateRencanaPembelajaran(req.params.id, req.body);
        if (result) return responseBuilder.status("success").code(200).message("Sesi pembelajaran berhasil diupdate").json(result);
        return responseBuilder.status("failure").code(404).message("Data tidak ditemukan").json();
    } catch (error) {
        return responseBuilder.status("failure").code(500).message(error.message).json();
    }
};

export const deleteRencanaPembelajaran = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    try {
        const success = await rpsService.deleteRencanaPembelajaran(req.params.id);
        if (success) return responseBuilder.status("success").code(200).message("Sesi pembelajaran berhasil dihapus").json();
        return responseBuilder.status("failure").code(404).message("Data tidak ditemukan").json();
    } catch (error) {
        return responseBuilder.status("failure").code(500).message(error.message).json();
    }
};
// ==========================================
// --- BAGIAN RENCANA EVALUASI (HALAMAN 8) ---
// ==========================================
export const getRencanaEvaluasi = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    try {
        const data = await rpsService.getRencanaEvaluasi(req.params.mataKuliahId);
        return responseBuilder.status("success").code(200).message("Berhasil mengambil data evaluasi").json(data);
    } catch (error) {
        return responseBuilder.status("failure").code(500).message(error.message).json();
    }
};

export const createRencanaEvaluasi = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    try {
        const data = await rpsService.createRencanaEvaluasi(req.params.mataKuliahId, req.body);
        return responseBuilder.status("success").code(201).message("Rencana Evaluasi berhasil ditambahkan").json(data);
    } catch (error) {
        return responseBuilder.status("failure").code(500).message(error.message).json();
    }
};

export const updateRencanaEvaluasi = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    try {
        const result = await rpsService.updateRencanaEvaluasi(req.params.id, req.body);
        if (result) return responseBuilder.status("success").code(200).message("Rencana Evaluasi berhasil diupdate").json(result);
        return responseBuilder.status("failure").code(404).message("Data tidak ditemukan").json();
    } catch (error) {
        return responseBuilder.status("failure").code(500).message(error.message).json();
    }
};

export const deleteRencanaEvaluasi = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    try {
        const success = await rpsService.deleteRencanaEvaluasi(req.params.id);
        if (success) return responseBuilder.status("success").code(200).message("Rencana Evaluasi berhasil dihapus").json();
        return responseBuilder.status("failure").code(404).message("Data tidak ditemukan").json();
    } catch (error) {
        return responseBuilder.status("failure").code(500).message(error.message).json();
    }
};