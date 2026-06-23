import * as soalService from '../../services/soal.service.js';
import ResponseBuilder from "../../utils/response.js";

// --- CRUD SOAL (rubrik per komponen evaluasi) ---
export const fetchSoalByKomponen = async (req, res, next) => {
    try {
        const { rencanaEvaluasiId } = req.params;
        const data = await soalService.getSoalByKomponen(rencanaEvaluasiId);
        return new ResponseBuilder(res).code(200).message("Berhasil mengambil daftar soal").json(data);
    } catch (error) { next(error); }
};

export const postSoal = async (req, res, next) => {
    try {
        const { rencanaEvaluasiId } = req.params;
        const data = await soalService.createSoal(rencanaEvaluasiId, req.body);
        return new ResponseBuilder(res).code(201).message("Berhasil menambahkan soal").json(data);
    } catch (error) { next(error); }
};

export const putSoal = async (req, res, next) => {
    try {
        const { soalId } = req.params;
        const data = await soalService.updateSoal(soalId, req.body);
        return new ResponseBuilder(res).code(200).message("Berhasil mengubah soal").json(data);
    } catch (error) { next(error); }
};

export const deleteSoal = async (req, res, next) => {
    try {
        const { soalId } = req.params;
        await soalService.deleteSoal(soalId);
        return new ResponseBuilder(res).code(200).message("Berhasil menghapus soal").json({});
    } catch (error) { next(error); }
};

// --- INPUT NILAI PER SOAL (Jalur C) ---
export const postNilaiPerSoal = async (req, res, next) => {
    try {
        const { krsId } = req.params;
        const { nilaiSoal } = req.body;
        const data = await soalService.inputNilaiPerSoal(krsId, nilaiSoal);
        return new ResponseBuilder(res).code(200).message("Nilai per soal berhasil disimpan").json(data);
    } catch (error) { next(error); }
};
