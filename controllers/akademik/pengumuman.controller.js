import * as pengumumanService from "../../services/pengumuman.service.js";
import ResponseBuilder from "../../utils/response.js";
import { getPagingData } from "../../utils/pagination.js";
import { BadRequestError } from "../../utils/custom-error.js";

export const findAll = async (req, res, next) => {
    const page = req.query.page ? parseInt(req.query.page) : null;
    const size = req.query.size ? parseInt(req.query.size) : null;
    const responseBuilder = new ResponseBuilder(res);

    try {
        const data = await pengumumanService.findAll(page, size);

        let payload;
        if (data.isPaginated === true) {
            payload = getPagingData(data, page, size);
        } else {
            payload = data.rows;
        }

        responseBuilder
            .status("success")
            .code(200)
            .message("Berhasil Menggambil data")
            .json(payload);
    } catch (error) {
        next(error)
    }
};

export const findOneById = async (req, res, next) => {
    const { id } = req.params;
    const responseBuilder = new ResponseBuilder(res);

    try {
        const data = await pengumumanService.findOneById(id);

        responseBuilder
            .status("success")
            .code(200)
            .message("Berhasil Menggambil data")
            .json(data)
    } catch (error) {
        next(error)
    }
}

export const create = async (req, res, next) => {
    const responseBuilder = new ResponseBuilder(res);
    const body = req.body;
    const user = req.user;

    const files = req.files['file'];
    const file = files[0];

    try {
        const data = await pengumumanService.createPengumuman(body, file, user.id);

        responseBuilder
            .status("success")
            .code(201)
            .message("Data Pengumuman berhasil ditambahkan.")
            .json(data);
    } catch (error) {
        next(error)
    }
}

export const updatePengumuman = async (req, res, next) => {
    const responseBuilder = new ResponseBuilder(res);
    const { id } = req.params;
    const body = req.body;

    try {
        const data = await pengumumanService.updatePengumuman(id, body);

        responseBuilder
            .status("success")
            .code(200)
            .message("Data Pengumuman berhasil diperbarui")
            .json(data);
    } catch (error) {
        next(error)
    }
}

export const deletePengumuman = async (req, res, next) => {
    const responseBuilder = new ResponseBuilder(res);
    const { id } = req.params;

    try {
        await pengumumanService.deletePengumuman(id);

        responseBuilder
            .status("success")
            .code(200)
            .message("Data Pengumuman berhasil dihapus")
            .json();
    } catch (error) {
        next(error)
    }
}