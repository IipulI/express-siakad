import * as dosenService from '../../services/dosen.service.js';
import ResponseBuilder from '../../utils/response.js';
import { getPagingData } from "../../utils/pagination.js";

export const findAll = async (req, res, next) => {
    const responseBuilder = new ResponseBuilder(res)
    const page = req.query.page ? parseInt(req.query.page) : null;
    const size = req.query.size ? parseInt(req.query.size) : null;
    const filter = req.query

    try {
        const data = await dosenService.fetchAllDosen(page, size, filter)

        let payload
        if (data.isPaginated) {
            payload = getPagingData(data, page, size)
        } else {
            payload = data.rows
        }

        responseBuilder
            .status('success')
            .message('Berhasil mengambil data')
            .json(payload)
    } catch (error) {
        next(error)
    }
}

export const syncSimpeg = async (req, res, next) => {
    const responseBuilder = new ResponseBuilder(res)

    try {
        const stats = await dosenService.syncFromSimpeg()

        responseBuilder
            .status('success')
            .message('Sinkronisasi data dosen dari Simpeg berhasil')
            .json(stats)
    } catch (error) {
        next(error)
    }
}

export const findOneById = async (req, res, next) => {
    const responseBuilder = new ResponseBuilder(res)
    const id = req.params.id

    try {
        const data = await dosenService.findOneById(id)

        responseBuilder
            .status('success')
            .message('Berhasil mengambil data')
            .json(data)
    } catch (error) {
        next(error)
    }
}
