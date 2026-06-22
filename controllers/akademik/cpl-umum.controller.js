
import * as CplUmumService from '../../services/cpl-umum.service.js';
import ResponseBuilder from "../../utils/response.js";
export const fetchCplUmum = async (req, res, next) => {
    try {
        const { search, kategori } = req.query;
        const tahunKurikulumId = req.params.tahunKurikulumId;

        const data = await CplUmumService.getCplUmumList(tahunKurikulumId, search, kategori);
        return new ResponseBuilder(res).code(200).message("Berhasil mengambil data CPL Umum").json(data);
    } catch (error) { 
        next(error); // 👈 Lempar ke Global Error Handler
    }
};

export const saveCplUmum = async (req, res, next) => {
    try {
        const tahunKurikulumId = req.params.tahunKurikulumId;
        const payload = req.body;

        const data = await CplUmumService.upsertCplUmum(tahunKurikulumId, payload);
        return new ResponseBuilder(res).code(200).message("Berhasil menyimpan CPL Umum").json(data);
    } catch (error) { 
        next(error); 
    }
};

export const deleteCplUmum = async (req, res, next) => {
    try {
        const idCplUmum = req.params.id;
        await CplUmumService.destroyCplUmum(idCplUmum);
        return new ResponseBuilder(res).code(200).message("Berhasil menghapus CPL Umum").json();
    } catch (error) {
        next(error);
    }
};

export const fetchOpsiTingkatCpl = async (req, res, next) => {
    try {
        const data = await CplUmumService.getOpsiTingkatCpl();
        return new ResponseBuilder(res).code(200).message("Berhasil mengambil opsi Tingkat CPL").json(data);
    } catch (error) {
        next(error);
    }
};