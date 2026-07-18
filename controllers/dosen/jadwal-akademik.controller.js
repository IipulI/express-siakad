import * as jadwalService from '../../services/jadwal-akademik.service.js'
import ResponseBuilder from "../../utils/response.js";

export const getWeeklySchedule = async (req, res, next) => {
    const responseBuilder = new ResponseBuilder(res)
    const user = req.user

    try {
        const data = await jadwalService.getWeeklyScheduleLecturer(user.dosen.id)

        responseBuilder
            .status('success')
            .code(200)
            .message("berhasil mengambil data")
            .json(data)
    }
    catch (error) {
        console.error(error)
        next(error)
    }
}