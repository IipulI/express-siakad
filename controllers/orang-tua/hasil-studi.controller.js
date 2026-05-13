import * as hasilStudiService from '../../services/hasil-studi.service.js'
import ResponseBuilder from "../../utils/response.js";
import db from "../../models/index.js";
import { NotFoundError } from "../../utils/custom-error.js";

const { Mahasiswa } = db;

export const getHasilStudi = async (req, res, next) => {
    const responseBuilder = new ResponseBuilder(res)
    const npm = req.query.npm ? req.query.npm : null;
    const periodeId = req.query.periodeId ? req.query.periodeId : null;

    const mahasiswa = await Mahasiswa.findOne({
        where: {
            npm: npm
        }
    })
    if (!mahasiswa) {
        throw new NotFoundError("Mahasiswa tidak ditemukan")
    }

    try {
        const data = await hasilStudiService.getHasilStudi(mahasiswa.id, periodeId)

        responseBuilder
            .status('success')
            .code(200)
            .message("berhasil mengambil data")
            .json(data)
    } catch (error) {
        next(error)
    }
}