import * as KetentuanService from '../../services/ketentuan-akademik.service.js';
import ResponseBuilder from "../../utils/response.js";

// --- CONTROLLER SKALA NILAI ---
export const fetchSkalaNilai = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    try {
        const { programStudiId, tahunKurikulumId } = req.query;
        if (!programStudiId || !tahunKurikulumId) {
            throw new Error(`Program Studi dan Tahun Kurikulum wajib diisi`);
        }
        const data = await KetentuanService.getSkalaNilai(programStudiId, tahunKurikulumId);
        return responseBuilder.code(200).message("Data Skala Nilai berhasil diambil").json(data);
    } catch (error) {
        return responseBuilder.status("failure").code(500).message(error.message).json();
    }
};

export const upsertSkalaNilai = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    try {
        // req.body berisi: id (jika update), programStudiId, tahunKurikulumId, hurufMutu, angkaMutu, dll
        const payload = {
            id: req.body.id,
            siakProgramStudiId: req.body.programStudiId,
            siakTahunKurikulumId: req.body.tahunKurikulumId,
            hurufMutu: req.body.hurufMutu,
            angkaMutu: req.body.angkaMutu,
            nilaiMin: req.body.nilaiMin,
            nilaiMax: req.body.nilaiMax
        };
        await KetentuanService.saveSkalaNilai(payload);
        return responseBuilder.code(200).message("Data Skala Nilai berhasil disimpan").json();
    } catch (error) {
        return responseBuilder.status("failure").code(500).message(error.message).json();
    }
};

export const destroySkalaNilai = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    try {
        await KetentuanService.deleteSkalaNilai(req.params.id);
        return responseBuilder.code(200).message("Data Skala Nilai berhasil dihapus").json();
    } catch (error) {
        return responseBuilder.status("failure").code(500).message(error.message).json();
    }
};

// --- CONTROLLER BATAS SKS ---
export const fetchBatasSks = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    try {
        const { jenjangId } = req.query;
        if (!jenjangId) throw new Error(`Jenjang ID wajib diisi`);
        
        const data = await KetentuanService.getBatasSks(jenjangId);
        return responseBuilder.code(200).message("Data Batas SKS berhasil diambil").json(data);
    } catch (error) {
        return responseBuilder.status("failure").code(500).message(error.message).json();
    }
};

export const upsertBatasSks = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    try {
        const payload = {
            id: req.body.id,
            siakJenjangId: req.body.jenjangId,
            ipsMin: req.body.ipsMin,
            ipsMax: req.body.ipsMax,
            batasSks: req.body.batasSks
        };
        await KetentuanService.saveBatasSks(payload);
        return responseBuilder.code(200).message("Data Batas SKS berhasil disimpan").json();
    } catch (error) {
        return responseBuilder.status("failure").code(500).message(error.message).json();
    }
};

export const destroyBatasSks = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    try {
        await KetentuanService.deleteBatasSks(req.params.id);
        return responseBuilder.code(200).message("Data Batas SKS berhasil dihapus").json();
    } catch (error) {
        return responseBuilder.status("failure").code(500).message(error.message).json();
    }
};