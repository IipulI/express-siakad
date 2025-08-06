import * as tahunKurikulumService from "../../services/tahun-kurikulum.service.js"
import ResponseBuilder from "../../utils/response.js";
import {getPagingData} from "../../utils/pagination.js";
import {validationResult} from "express-validator";


export const findAll = async (req, res) => {
    const page = req.query.page ? parseInt(req.query.page) : null;
    const size = req.query.size ? parseInt(req.query.size) : null;
    const responseBuilder = new ResponseBuilder(res);

    try {
        const data = await tahunKurikulumService.findAll(page, size)

        let payload;
        if(data.isPaginated === true) {
            payload = getPagingData(data, page, size);
        } else {
            payload = data.rows
        }

        responseBuilder
            .code(200)
            .message("Berhasil menggambil data")
            .json(payload)
    }
    catch (err) {
        responseBuilder
            .status('failure')
            .code(500)
            .message(err.message || 'Some error occurred.')
            .json();
    }
}

export const create = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);

    // request validation
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return responseBuilder
            .status('failure')
            .code(422)
            .message("validation failed.")
            .json(errors.array());
    }

    try {
        await tahunKurikulumService.createTahunKurikulum(req.body)

        responseBuilder
            .code(201)
            .message("Data periode akademik berhasil ditambahkan")
            .json();
    }
    catch (err) {
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
            .message(err.message || 'Terjadi kesalahan saat menambahkan data Tahun Kurikulum.')
            .json();
    }
}

export const update = async (req, res) => {
    const { id } = req.params;
    const responseBuilder = new ResponseBuilder(res);
    const { tahun, nama, keterangan, tanggalMulai, tanggalSelesai } = req.body;

    // request validation
    if (!tahun || !nama || !keterangan || !tanggalMulai || !tanggalSelesai) {
        return responseBuilder
            .status('failure')
            .code(404)
            .message("At least one field (tahun, nama, keterangan, tanggalMulai, tanggalSelesai) is required for update")
            .json();
    }

    try {
        const isUpdated = await tahunKurikulumService.updateTahunKurikulum(req.body)

        if (isUpdated) {
            return responseBuilder.status('success')
                .code(200)
                .message("Update data successfully")
                .json();
        } else {
            return responseBuilder
                .status('failure')
                .code(404)
                .message(`Tahun kurikulum with ID ${id} not found or no changes were made`)
                .json();
        }
    }
    catch (error) {
        responseBuilder
            .status('failure')
            .code(500)
            .message("Unexpected error occurred.")
            .json();
    }
}

export const destroy = async (req, res) => {
    const { id } = req.params;
    const responseBuilder = new ResponseBuilder(res);

    try {
        const isDeleted = await tahunKurikulumService.deleteTahunKurikulum(id);

        if (isDeleted) {
            return res.status(204).end();
        }
        else {
            return responseBuilder
                .status('failure')
                .code(404)
                .message(`Tahun Kurikulum with ID ${id} not found.`)
                .json();
        }
    } catch (error) {
        console.error(error);
        return responseBuilder
            .status('failure')
            .code(500)
            .message('Unexpected error occurred.')
            .json();
    }
}