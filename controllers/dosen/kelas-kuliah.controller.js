import * as kelasKuliahService from '../../services/kelas-kuliah.service.js'
import ResponseBuilder from "../../utils/response.js";
import { getPagingData } from "../../utils/pagination.js";
import { detailClass } from "../../services/kelas-kuliah.service.js";

export const getKelasKuliah = async (req, res, next) => {
    const page = req.query.page ? parseInt(req.query.page) : null;
    const size = req.query.size ? parseInt(req.query.size) : null;
    const responseBuilder = new ResponseBuilder(res)

    try {
        const data = await kelasKuliahService.findAll(page, size)

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

export const getDetailKelasKuliah = async (req, res, next) => {
    const { id } = req.params
    const responseBuilder = new ResponseBuilder(res)

     try {
        const data = await kelasKuliahService.detailClass(id)

        responseBuilder
            .status('success')
            .code(200)
            .message("Berhasil mengambil data")
            .json(data)
     } catch (error) {
        console.error(error)
        next(error)
     }
}

