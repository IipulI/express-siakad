import * as jadwalService from '../../services/jadwal-akademik.service.js'
import ResponseBuilder from "../../utils/response.js";

export const getWeeklySchedule = async (req, res, next) => {
    const responseBuilder = new ResponseBuilder(res)
    const user = req.user

    try {
        const data = await jadwalService.getWeeklyScheduleStudent(user.mahasiswa.id)

        responseBuilder
            .status('success')
            .code(200)
            .message("berhasil mengambil data")
            .json(data)
    }
    catch (error) {
        next(error)
    }
}

export const getDailySchedule = async (req, res, next) => {
    const responseBuilder = new ResponseBuilder(res)
    const hari = req.query.hari
    const periodeId = req.query.periodeId
    const user = req.user

    try {
        const data = await jadwalService.getDailyScheduleStudent(user.mahasiswa.id, periodeId, hari)

        responseBuilder
            .status('success')
            .code(200)
            .message("berhasil mengambil data")
            .json(data)
    } catch (error) {
        console.error(error)
        next(error)
    }
}