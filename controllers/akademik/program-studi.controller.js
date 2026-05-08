import * as programStudiService from '../../services/program-studi.service.js'
import ResponseBuilder from "../../utils/response.js";
import { getPagingData } from "../../utils/pagination.js";

export const findAll = async (req, res, next) => {
    const responseBuilder = new ResponseBuilder(res)
    const page = req.query.page ? parseInt(req.query.page) : null;
    const size = req.query.size ? parseInt(req.query.size) : null;

    try {
        const data = await programStudiService.findAll(page, size)

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
        console.error(error)

        responseBuilder
            .status('failure')
            .code(500)
            .json()
    }
}