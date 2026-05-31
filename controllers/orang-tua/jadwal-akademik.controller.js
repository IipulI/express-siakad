import * as jadwalService from '../../services/jadwal-akademik.service.js'
import ResponseBuilder from "../../utils/response.js";
import db from "../../models/index.js";
import { NotFoundError } from "../../utils/custom-error.js";

const { Mahasiswa } = db;

export const getWeeklySchedule = async (req, res, next) => {
    const responseBuilder = new ResponseBuilder(res)
    const npm = req.query.npm ? req.query.npm : null;

    // mahasiswa
    const mahasiswa = await Mahasiswa.findOne({
        where: { npm: npm }
    })
    if (!mahasiswa) {
        throw new NotFoundError("Mahasiswa tidak ditemukan")
    }

    try {
        const data = await jadwalService.getWeeklyScheduleStudent(mahasiswa.id)

        responseBuilder
            .status('success')
            .code(200)
            .message("berhasil mengambil data")
            .json(data)
    } catch (error) {
        next(error)
    }
}