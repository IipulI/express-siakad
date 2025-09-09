import * as mahasiswaService from '../../services/mahasiswa.service.js'
import ResponseBuilder from "../../utils/response.js";
import { getPagingData } from "../../utils/pagination.js";

export const findAll = async (req, res) => {
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
        response
            .status('failure')
            .code(500)
            .message("Gagal mengambil data")
            .json(error.message)
    }
}

export const findOne = async (req, res) => {
    const response = new ResponseBuilder(res)
    const mahasiswaId = req.params.id

    try {
        const data = await mahasiswaService.findOne(mahasiswaId)

        response
            .code(200)
            .message("Berhasil mengambil data")
            .json(data)
    } catch (error) {
        response
            .status('failure')
            .code(500)
            .message("Gagal mengambil data")
            .json(error.message)
    }
}

export const create = async (req, res) => {
    const response = new ResponseBuilder(res)

    try {

    }
    catch (error) {
        response
            .status('failure')
            .code(500)
            .message("Gagal mengambil data")
            .json(error.message)
    }
}