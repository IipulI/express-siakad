import * as batasSksService from "../../services/batas-sks.service.js";
import ResponseBuilder from "../../utils/response.js";
import { getPagingData } from "../../utils/pagination.js";

export const fetchBatasSks = async (req, res, next) => {
    try {
        const { jenjangId, tahunKurikulumId } = req.query;

        const data = await batasSksService.getBatasSksList(jenjangId, tahunKurikulumId);

        return new ResponseBuilder(res)
            .code(200)
            .message("Berhasil mengambil data Batas SKS")
            .json(data);
    } catch (error) { next(error); }
};

export const findOneById = async (req, res, next) => {
    const id = req.params.id;
    const responseBuilder = new ResponseBuilder(res);

    try {
        const data = await batasSksService.findOneById(id);

        responseBuilder
            .code(200)
            .message("Berhasil Mengambil data")
            .json(data);
    } catch (error) {
        next(error)
    }
}

export const create = async (req, res, next) => {
    const responseBuilder = new ResponseBuilder(res);
    const body = req.body;

    try {
        const data = await batasSksService.createBatasSks(body);

        responseBuilder
            .code(201)
            .message("Data Batas Sks berhasil ditambahkan.")
            .json(data);
    } catch (err) {
        next(err)
    }
};

export const updateBatasSks = async (req, res, next) => {
    const { id } = req.params;
    const responseBuilder = new ResponseBuilder(res);

    try {
        const data = await batasSksService.updateBatasSks(id, req.body);

        responseBuilder
            .code(200)
            .message("Data Batas Sks berhasil diperbarui")
            .json(data);
    } catch (error) {
        next(error)
    }
};

export const deleteBatasSks = async (req, res, next) => {
    const responseBuilder = new ResponseBuilder(res)
    const id = req.params.id

    try {
        await batasSksService.deleteBatasSks(id);

        responseBuilder
            .status("success")
            .code(200)
            .message("Data Batas Sks berhasil dihapus")
            .json();
    } catch (error) {
        next(error)
    }
}