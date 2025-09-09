import * as KelasKuliahService from '../../services/kelas-kuliah.service.js';
import ResponseBuilder from "../../utils/response.js";
import {getPagingData} from "../../utils/pagination.js";

export const findAll = async (req, res) => {
    const page = req.query.page ? parseInt(req.query.page) : null;
    const size = req.query.size ? parseInt(req.query.size) : null;
    const responseBuilder = new ResponseBuilder(res);

    const filter = {
        siakPeriodeAkademikId : req.query.siakPeriodeAkademikId,
        siakProgramStudiId : req.query.siakProgramStudiId,
        siakSistemKuliahId : req.query.siakSistemKuliahId,
        siakTahunKurikulumId: req.query.siakTahunKurikulumId,
    }

    try {
        const classes = await KelasKuliahService.findAll(page, size, filter);

        let payload;
        if (classes.isPaginated === true) {
            payload = getPagingData(classes, page, size);
        } else {
            payload = classes.rows;
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

export const getGradingClass = async (req, res) => {
    const id = req.params.id;
    const responseBuilder = new ResponseBuilder(res);

    try {
        const dataClass = await KelasKuliahService.getGradingClass(id)

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

export const submitGradingClass = async (req, res) => {
    const id = req.params.id;
    const responseBuilder = new ResponseBuilder(res)
    const body ={
        siakMahasiswaId : req.body.siakMahasiswaId,
        kehadiran : req.body.kehadiran,
        tugas : req.body.tugas,
        uts : req.body.uts,
        uas : req.body.uas
    };

    try {
        if (parseFloat(body.kehadiran) > 100 || parseFloat(body.tugas) > 100 || parseFloat(body.uts) > 100 || parseFloat(body.uas) > 100) {
            throw new Error("Nilai tidak boleh lebih dari 100")
        }
        else if (parseFloat(body.kehadiran) < 0 || parseFloat(body.tugas) < 0 || parseFloat(body.uts) < 0 || parseFloat(body.uas) < 0) {
            throw new Error("Nilai tidak boleh kurang dari 0")
        }

        const success = await KelasKuliahService.submitGradingClass(id, body)

        if (success) {
            responseBuilder
                .code(200)
                .message("Berhasil menginput nilai")
                .json()
        } else {
            responseBuilder
                .status('failure')
                .code(400)
                .message("Gagal menginput nilai")
        }
    }
    catch (error) {
        return responseBuilder
            .status('failure')
            .code(500)
            .message(error.message || "Kesalahan yang tidak terduga.")
            .json();
    }
}
