import ResponseBuilder from "../../utils/response.js";
import * as pembimbingAkademikService from '../../services/pembiming-akademik.service.js'
import { getPagingData } from "../../utils/pagination.js";

export const getAllAssignedMahasiswa = async (req, res, next) => {
    const responseBuilder = new ResponseBuilder(res)
    const body = req.query
    const user = req.user

    const page = req.query.page ? parseInt(req.query.page) : null;
    const size = req.query.size ? parseInt(req.query.size) : null;

    try {
        const data = await pembimbingAkademikService.getAllMahasiswaFiltered(body, user.dosen, page, size)

        let payload
        if(data.isPaginated) {
            payload = getPagingData(data, page, size)
        } else {
            payload = data.rows
        }

        responseBuilder
            .status('success')
            .code(200)
            .message("Berhasil")
            .json(payload)
    }
    catch (error) {
        next(error)
    }
}