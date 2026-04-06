import * as predikatService from '../../services/predikat-kelulusan.service.js';
import ResponseBuilder from "../../utils/response.js";

export const fetchAll = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    try {
        const { tahunKurikulumId, jenjangId } = req.query;
        
        // Validasi agar tidak mencari semua data sembarangan
        if (!tahunKurikulumId || !jenjangId) {
            throw new Error("Parameter tahunKurikulumId dan jenjangId wajib dikirim!");
        }

        const data = await predikatService.getPredikatKelulusan(tahunKurikulumId, jenjangId);
        return responseBuilder.code(200).message("Berhasil mengambil data predikat kelulusan").json(data);
    } catch (error) {
        return responseBuilder.status("failure").code(500).message(error.message).json();
    }
};

export const create = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    try {
        await predikatService.createPredikatKelulusan(req.body);
        return responseBuilder.code(201).message("Data Predikat Kelulusan berhasil ditambahkan").json();
    } catch (error) {
        return responseBuilder.status("failure").code(500).message(error.message).json();
    }
};

export const update = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    const { id } = req.params;

    try {
        const isUpdated = await predikatService.updatePredikatKelulusan(id, req.body);
        if (isUpdated) {
            return responseBuilder.code(200).message("Data berhasil diperbarui").json();
        } else {
            return responseBuilder.status("failure").code(404).message(`Data dengan ID ${id} tidak ditemukan`).json();
        }
    } catch (error) {
        return responseBuilder.status("failure").code(500).message(error.message).json();
    }
};

export const destroy = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    const { id } = req.params;

    try {
        const isDeleted = await predikatService.deletePredikatKelulusan(id);
        if (isDeleted) {
            return responseBuilder.code(200).message("Data berhasil dihapus").json();
        } else {
            return responseBuilder.status("failure").code(404).message(`Data dengan ID ${id} tidak ditemukan`).json();
        }
    } catch (error) {
        return responseBuilder.status("failure").code(500).message(error.message).json();
    }
};