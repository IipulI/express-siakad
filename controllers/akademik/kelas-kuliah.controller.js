import * as KelasKuliahService from '../../services/kelas-kuliah.service.js';
import ResponseBuilder from "../../utils/response.js";
import {getPagingData} from "../../utils/pagination.js";

export const findAll = async (req, res) => {
    const page = req.query.page ? parseInt(req.query.page) : null;
    const size = req.query.size ? parseInt(req.query.size) : null;
    const responseBuilder = new ResponseBuilder(res);

    try {
        const classes = await KelasKuliahService.findAll(page, size);

        let payload = getPagingData(classes, page, size);

        return responseBuilder
            .code(200)
            .message("Data berhasil diambil")
            .json(payload)
    }
    catch (error) {
        return responseBuilder
            .status('failure')
            .code(500)
            .message(error.message || "Kesalahan yang tidak terduga")
            .json();
    }
}

export const findOne = async (req, res) => {
    const id = req.params.id;
    const responseBuilder = new ResponseBuilder(res);

    try {
        const dataClass = await KelasKuliahService.detailClass(id)

        return responseBuilder
            .code(200)
            .message("Data berhasil diambil")
            .json(dataClass)
    }
    catch (error) {
        return responseBuilder
            .status('failure')
            .code(500)
            .message(error.message || "Kesalahan yang tidak terduga")
            .json();
    }
}

export const schedules = async (req, res) => {
    const id = req.params.id;
    const responseBuilder = new ResponseBuilder(res);

    try {
        const dataClass = await KelasKuliahService.classSchedule(id)

        return responseBuilder
            .code(200)
            .message("Data berhasil diambil.")
            .json(dataClass)
    }
    catch (error) {
        return responseBuilder
            .status('failure')
            .code(500)
            .message(error.message || "Kesalahan yang tidak terduga")
            .json();
    }
}

export const classParticipant = async (req, res) => {
    const id = req.params.id;
    const responseBuilder = new ResponseBuilder(res);

    try {
        const dataClass = await KelasKuliahService.classParticipant(id)

        return responseBuilder
            .code(200)
            .message("Data berhasil diambil")
            .json(dataClass)
    }
    catch (error) {
        return responseBuilder
            .status('failure')
            .code(500)
            .message(error.message || "Kesalahan yang tidak terduga.")
            .json();
    }
}

