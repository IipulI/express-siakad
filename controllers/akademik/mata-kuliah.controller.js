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
            .message("Data berhasil diambil")
            .json(payload)
    }
    catch (error) {
        return responseBuilder
            .status('failure')
            .code(500)
            .message(error.message || 'Terjadi kesalahan tak terduga')
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
            .message("Data berhasil diambil")
            .json(data);
    }
    catch (error) {
        responseBuilder
            .status('failure')
            .code(500)
            .message(error.message || 'Terjadi kesalahan tak terduga')
            .json();
    }
}

export const create = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);

    try {
        await MataKuliahService.createMataKuliah(req.body);

        responseBuilder
            .code(201)
            .message("Data Mata Kuliah berhasil dibuat")
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
            .message(error.message || 'Terjadi kesalahan yang tidak terduga')
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
                .message("Data berhasil diperbarui")
                .json();
        }
        else {
            return responseBuilder
                .status("failure")
                .code(404)
                .message(
                    `Periode Akademik dengan ID ${id} tidak ditemukan atau tidak ada perubahan yang dilakukan`
                )
                .json();
        }
    }
    catch (error) {
        return responseBuilder
            .status("failure")
            .code(500)
            .message("Terjadi kesalahan yang tidak terduga.")
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
                .message(`Mata kuliah dengan ID ${id} tidak ditemukan`)
                .json();
        }
    }
    catch (error) {
        return responseBuilder
            .status("failure")
            .code(500)
            .message("Terjadi kesalahan yang tidak terduga")
            .json();
    }
}