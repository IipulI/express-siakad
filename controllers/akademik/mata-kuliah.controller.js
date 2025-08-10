import * as MataKuliahService from "../../services/mata-kuliah.service.js";
import ResponseBuilder from "../../utils/response.js";
import {getPagingData} from "../../utils/pagination.js";

export const findAll = async (req, res) => {
    const page = req.query.page ? parseInt(req.query.page) : null;
    const size = req.query.size ? parseInt(req.query.size) : null;
    const responseBuilder = new ResponseBuilder(res);

    try {
        const data = await MataKuliahService.findAll(page, size);

        let payload;
        if (data.isPaginated === true) {
            payload = getPagingData(data, page, size);
        } else {
            payload = data.rows
        }

        return responseBuilder
            .code(200)
            .message("Successfully retrieve data")
            .json(payload)
    }
    catch (error) {
        return responseBuilder
            .status('failure')
            .code(500)
            .message(error.message || 'Unexpected error')
            .json();
    }
}

export const findOne = async (req, res) => {
    const id = req.params.id;
    const responseBuilder = new ResponseBuilder(res);

    try {
        const data = await MataKuliahService.findOne(id);

        responseBuilder
            .code(200)
            .message("Successfully retrieve data")
            .json(data);
    }
    catch (error) {
        responseBuilder
            .status('failure')
            .code(500)
            .message(error.message || 'Unexpected error')
            .json();
    }
}

export const create = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);

    try {
        await MataKuliahService.createMataKuliah(req.body);

        responseBuilder
            .code(201)
            .message("Successfully creating MataKuliah data")
            .json();
    }
    catch (error) {
        if(error.message.includes('already exists')) {
            return responseBuilder
                .status('failure')
                .code(409)
                .message(error.message)
                .json();
        }

        responseBuilder
            .status('failure')
            .code(500)
            .message(error.message || 'Unexpected error')
            .json();
    }
}

export const update = async (req, res) => {
    const id = req.params.id;
    const responseBuilder = new ResponseBuilder(res);

    try {
        const isUpdated = await MataKuliahService.updateMataKuliah(id, req.body)

        if (isUpdated) {
            return responseBuilder
                .status("success")
                .code(200)
                .message("Update data successfully.")
                .json();
        }
        else {
            return responseBuilder
                .status("failure")
                .code(404)
                .message(
                    `Periode Akademik with ID ${id} not found or no changes were made.`
                )
                .json();
        }
    }
    catch (error) {
        return responseBuilder
            .status("failure")
            .code(500)
            .message("Unexpected error")
            .json();
    }
}

export const destroy = async (req, res) => {
    const id = req.params.id;

    try {
        const isDeleted = await MataKuliahService.deleteMataKuliah(id)

        if (isDeleted) {
            return res.status(204).end();
        }
        else {
            return responseBuilder
                .status("failure")
                .code(404)
                .message(`Mata Kuliah with ID ${id} not found.`)
                .json();
        }
    }
    catch (error) {
        return responseBuilder
            .status("failure")
            .code(500)
            .message("Unexpected error")
            .json();
    }
}