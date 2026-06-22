import * as ekivalensiService from '../../services/ekivalensi.service.js';
import ResponseBuilder from "../../utils/response.js";

export const fetchDaftarEkivalensi = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    try {
        const { prodiId, kurikulumBaruId } = req.query;
        if (!prodiId || !kurikulumBaruId) {
            throw new Error("Parameter prodiId dan kurikulumBaruId wajib dikirim!");
        }
        const data = await ekivalensiService.getDaftarEkivalensi(prodiId, kurikulumBaruId);
        return responseBuilder.code(200).message("Berhasil mengambil data ekivalensi").json(data);
    } catch (error) {
        return responseBuilder.status("failure").code(500).message(error.message).json();
    }
};

export const saveEkivalensi = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    try {
        const { siakMataKuliahId, siakMataKuliahLamaId } = req.body;
        if (!siakMataKuliahId || !siakMataKuliahLamaId) {
            throw new Error("ID Mata Kuliah Baru dan ID Mata Kuliah Lama wajib diisi!");
        }

        await ekivalensiService.setEkivalensi(req.body);
        return responseBuilder.code(201).message("Mapping Ekivalensi berhasil disimpan").json();
    } catch (error) {
        return responseBuilder.status("failure").code(500).message(error.message).json();
    }
};

export const removeEkivalensi = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    try {
        await ekivalensiService.hapusEkivalensi(req.params.id);
        return responseBuilder.code(200).message("Mapping Ekivalensi berhasil dihapus").json();
    } catch (error) {
        return responseBuilder.status("failure").code(500).message(error.message).json();
    }
};