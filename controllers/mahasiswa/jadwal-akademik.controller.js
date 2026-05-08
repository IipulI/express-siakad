import * as jadwalService from '../../services/jadwal-akademik.service.js'
import ResponseBuilder from "../../utils/response.js";

export const getWeeklySchedule = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res)
    const user = req.user

    try {
        const data = await jadwalService.getWeeklySchedule(user.mahasiswa.id)

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