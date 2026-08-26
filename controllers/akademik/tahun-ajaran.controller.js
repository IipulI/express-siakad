import * as tahunAjaranService from "../../services/tahun-ajaran.service.js";
import ResponseBuilder from "../../utils/response.js";
import {getPagingData} from "../../utils/pagination.js";
import { validationResult } from 'express-validator';

export const findAll = async (req, res, next) => {
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
        next(err);
      }
};

export const findOne = async (req, res, next) => {
    const { id } = req.params;
    const responseBuilder = new ResponseBuilder(res);

    try {
        const data = await tahunAjaranService.findOneById(id);

        return responseBuilder
            .code(200)
            .message('Berhasil mengambil data')
            .json(data);
    } catch (err) {
        next(err);
      }
};

export const create = async (req, res, next) => {
    const responseBuilder = new ResponseBuilder(res);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return responseBuilder
            .status('failure')
            .code(422)
            .message('Validasi gagal')
            .json(errors.array());
    }

    try {
        const { tahun, nama } = req.body;

        await tahunAjaranService.createTahunAjaran({ tahun, nama });

        responseBuilder
            .code(201)
            .message('Data Tahun Ajaran berhasil ditambahkan.')
            .json();

    } catch (err) {
        next(err);
      }
};

export const updateTahunAjaran = async (req, res, next) => {
    const { id } = req.params;
    const { tahun, nama } = req.body;
    const responseBuilder = new ResponseBuilder(res);

    if (!tahun && !nama) {
        return responseBuilder
            .status('failure')
            .code(404)
            .message('Harus mengisi setidaknya satu field (tahun atau nama) untuk melakukan pembaruan')
            .json();
    }

    try {
        const isUpdated = await tahunAjaranService.updateTahunAjaran(id, { tahun, nama });

        if (isUpdated) {
            return responseBuilder.status('success')
                .code(200)
                .message("Data berhasil diperbarui")
                .json()
        } else {
            return responseBuilder
                .status('failure')
                .code(404)
                .message(`Tahun Ajaran dengan ID ${id} tidak ditemukan atau tidak ada perubahan yang dilakukan”`)
                .json();
        }
    } catch (error) {
        next(error);
      }
};

export const deleteTahunAjaran = async (req, res, next) => {
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
                .message(`Tahun Ajaran dengan ID ${id} tidak ditemukan`)
                .json();
        }
    } catch (error) {
        next(error);
      }
};