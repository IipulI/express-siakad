import * as tahunAjaranService from "../../services/tahun-ajaran.service.js";
import ResponseBuilder from "../../utils/response.js";
import {getPagingData} from "../../utils/pagination.js";
import { validationResult } from 'express-validator';

export const findAll = async (req, res) => {
    const page = req.query.page ? parseInt(req.query.page) : null;
    const size = req.query.size ? parseInt(req.query.size) : null;
    const responseBuilder = new ResponseBuilder(res);

    try {
        const data = await tahunAjaranService.findAll(page, size);

        let payload;
        if (data.isPaginated === true) {
            payload = getPagingData(data, page, size);
        } else {
            payload = data.rows
        }

        responseBuilder
            .code(200)
            .message('Berhasil mengambil data')
            .json(payload);

    } catch (err) {
        responseBuilder
            .status('failure')
            .code(500)
            .message(err.message || 'Some error occurred.')
            .json();
    }
};

export const create = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return responseBuilder
            .status('failure')
            .code(422)
            .message('Validation failed.')
            .json(errors.array());
    }

    try {
        const { tahun, nama } = req.body;

        const newTahunAjaran = await tahunAjaranService.createTahunAjaran({ tahun, nama });

        responseBuilder
            .code(201)
            .message('Data Tahun Ajaran berhasil ditambahkan.')
            .json(newTahunAjaran);

    } catch (err) {
        if (err.message.includes('already exists')) {
            return responseBuilder
                .status('failure')
                .code(409)
                .message(err.message)
                .json();
        }

        responseBuilder
            .status('failure')
            .code(500)
            .message(err.message || 'Terjadi kesalahan saat menambahkan data Tahun Ajaran.')
            .json();
    }
};

export const updateTahunAjaran = async (req, res) => {
    const { id } = req.params;
    const { tahun, nama } = req.body;
    const responseBuilder = new ResponseBuilder(res);

    if (!tahun && !nama) {
        return responseBuilder
            .status('failure')
            .code(404)
            .message('At least one field (tahun or nama) is required for update.')
            .json();
    }

    try {
        const isUpdated = await tahunAjaranService.updateTahunAjaran(id, { tahun, nama });

        if (isUpdated) {
            return responseBuilder.status('success')
                .code(200)
                .message("Update data successfully.")
                .json()
        } else {
            return responseBuilder
                .status('failure')
                .code(404)
                .message(`TahunAjaran with ID ${id} not found or no changes were made.`)
                .json();
        }
    } catch (error) {
        console.error(error);
        return responseBuilder
            .status('failure')
            .code(500)
            .message('Terjadi kesalahan internal server saat memperbarui TahunAjaranModels.')
            .json()
    }
};

export const deleteTahunAjaran = async (req, res) => {
    const { id } = req.params;
    const responseBuilder = new ResponseBuilder(res);

    try {
        const isDeleted = await tahunAjaranService.deleteTahunAjaran(id);

        if (isDeleted) {
            return res.status(204).end();
        } else {
            return responseBuilder
                .status('failure')
                .code(404)
                .message(`TahunAjaran with ID ${id} not found.`)
                .json();
        }
    } catch (error) {
        console.error(error);
        return responseBuilder
            .status('failure')
            .code(500)
            .message('Terjadi kesalahan internal server saat menghapus TahunAjaranModels.')
            .json();
    }
};