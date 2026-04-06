import * as skalaNilaiService from '../../services/skala-nilai.service.js';
import ResponseBuilder from "../../utils/response.js";

export const fetchSkalaNilai = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    try {
        const { programStudiId, tahunKurikulumId } = req.query;
        if (!programStudiId || !tahunKurikulumId) {
            throw new Error("Parameter programStudiId dan tahunKurikulumId wajib diisi");
        }
        const data = await skalaNilaiService.getSkalaNilaiByProdi(programStudiId, tahunKurikulumId);
        return responseBuilder.code(200).message("Data Skala Nilai berhasil diambil").json(data);
    } catch (error) {
        return responseBuilder.status("failure").code(500).message(error.message).json();
    }
};

export const saveSkalaNilai = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    try {
        const data = await skalaNilaiService.upsertSkalaNilai(req.body);
        return responseBuilder.code(200).message("Data Skala Nilai berhasil disimpan").json(data);
    } catch (error) {
        return responseBuilder.status("failure").code(500).message(error.message).json();
    }
};

export const destroySkalaNilai = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    try {
        await skalaNilaiService.deleteSkalaNilai(req.params.id);
        return responseBuilder.code(200).message("Data Skala Nilai berhasil dihapus").json();
    } catch (error) {
        return responseBuilder.status("failure").code(500).message(error.message).json();
    }
};