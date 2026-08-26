import * as mahasiswaService from '../../services/mahasiswa.service.js'
import ResponseBuilder from "../../utils/response.js";
import { getPagingData } from "../../utils/pagination.js";

export const findAll = async (req, res, next) => {
    const response = new ResponseBuilder(res)

    const page = req.query.page ? parseInt(req.query.page) : null;
    const size = req.query.size ? parseInt(req.query.size) : null;

    try {
        const data = await mahasiswaService.findAll(req.query, page, size)

        let payload;
        if (data.isPaginated === true) {
            payload = getPagingData(data, page, size);
        } else {
            payload = data.rows;
        }

        response
            .code(200)
            .message("Berhasil mengambil data")
            .json(payload)
    }
    catch (error) {
        console.error(error);
        next(error)
    }
}

export const findOne = async (req, res, next) => {
    const response = new ResponseBuilder(res)
    const mahasiswaId = req.params.id

    try {
        const data = await mahasiswaService.findOne(mahasiswaId)

        response
            .code(200)
            .message("Berhasil mengambil data")
            .json(data)
    } catch (error) {
        console.error(error);
        next(error)
    }
}

export const update = async (req, res, next) => {
    const response = new ResponseBuilder(res)
    const mahasiswaId = req.params.id

    try {
        const data = await mahasiswaService.updateMahasiswa(mahasiswaId, req.body)

        response
            .code(200)
            .message("Berhasil memperbarui data mahasiswa")
            .json(data)
    }
    catch (error) {
        console.error(error);
        next(error)
    }
}

export const remove = async (req, res, next) => {
    const mahasiswaId = req.params.id

    try {
        await mahasiswaService.deleteMahasiswa(mahasiswaId)

        return new ResponseBuilder(res)
            .status('success')
            .code(200)
            .message("Berhasil menghapus data mahasiswa")
            .json();
    }
    catch (error) {
        console.error(error);
        next(error)
    }
}

export const create = async (req, res, next) => {
    const response = new ResponseBuilder(res)

    const request = JSON.parse(req.body.request);
    const requestKeluarga = JSON.parse(req.body.requestKeluarga);

    try {
        const data = await mahasiswaService.create(request, requestKeluarga)

        response
            .status('success')
            .code(201)
            .message("Berhasil membuat data mahasiswa")
            .json(data)
    }
    catch (error) {
        console.error(error)
        next(error)
    }
}