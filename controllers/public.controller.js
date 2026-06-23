import * as publicService from '../services/public.service.js'
import ResponseBuilder from "../utils/response.js";
import { getPagingData } from "../utils/pagination.js";
import { fetchAllDosen as getAllDosen } from "../services/dosen.service.js"

export const fetchExport = async (req, res, next) => {
    const page = req.query.page ? parseInt(req.query.page) : null;
    const size = req.query.size ? parseInt(req.query.size) : null;
    const responseBuilder = new ResponseBuilder(res)

    try {
        const data = await publicService.fetchAllExport(page, size)

        let payload
        if (data.isPaginated) {
            payload = getPagingData(data, page, size)
        } else {
            payload = data.rows
        }

        responseBuilder
            .status('success')
            .message("Berhasil mengambil data")
            .json(payload)
    } catch (error) {
        console.error(error)
        next(error)
    }
}

export const fetchAllDosen = async (req, res, next) => {
    const page = req.query.page ? parseInt(req.query.page) : null;
    const size = req.query.size ? parseInt(req.query.size) : null;
    const responseBuilder = new ResponseBuilder(res)
    const filter = req.query

    try {
        const data = await getAllDosen(page, size, filter)

        let payload
        if (data.isPaginated) {
            payload = getPagingData(data, page, size)
        } else {
            payload = data.rows
        }

        responseBuilder
            .status('success')
            .message("Berhasil mengambil data")
            .json(payload)
    } catch (error) {
        console.error(error)
        next(error)
    }
}