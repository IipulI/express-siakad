import * as jadwalService from '../../services/jadwal-akademik.service.js'
import ResponseBuilder from "../../utils/response.js";

export const getWeeklySchedule = async (req, res) => {
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
        responseBuilder
            .status('failure')
            .status(500)
            .message(error.message || "An error occured")
    }
}

export const getWeeklyScheduleByNpm = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res)
    const { npm } = req.params

    try {
        const { default: db } = await import('../../models/index.js')
        const Mahasiswa = db.Mahasiswa

        const mahasiswa = await Mahasiswa.findOne({ where: { npm } })
        if (!mahasiswa) {
            return responseBuilder
                .status('failure')
                .code(404)
                .message("Mahasiswa tidak ditemukan")
                .send()
        }

        const data = await jadwalService.getWeeklyScheduleStudent(mahasiswa.id)

        responseBuilder
            .status('success')
            .code(200)
            .message("berhasil mengambil data")
            .json(data)
    }
    catch (error) {
        responseBuilder
            .status('failure')
            .code(500)
            .message(error.message || "An error occured")
            .send()
    }
}