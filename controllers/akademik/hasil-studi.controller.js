import * as hasilstudiService from "../../services/hasil-studi.service.js"
import * as krsMahasiswaService from "../../services/krs-mahasiswa.service.js"
import ResponseBuilder from "../../utils/response.js";

export const getHasilStudi = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res)

    try {
        const mahasiswaId = req.query.siakMahasiswaId
        const periodeId = req.query.siakPeriodeAkademikId

        const hasilStudi = await hasilstudiService.getHasilStudi(mahasiswaId, periodeId);

        responseBuilder
            .code(200)
            .message("Berhasil mengambil data")
            .json(hasilStudi)
    }
    catch (error) {
        responseBuilder
            .status('failure')
            .code(500)
            .message("Gagal mengambil data")
            .json(error.message);
    }
}

export const test = async(req, res) => {
    const responseBuilder = new ResponseBuilder(res)

    try {
        const mahasiswaId = req.query.siakMahasiswaId
        const periodeId = req.query.siakPeriodeAkademikId

        const data = await krsMahasiswaService.historyKrs(mahasiswaId, periodeId)

        responseBuilder.code(200).message("Berhasil mengambil data").json(data);
    }
    catch (error) {
        responseBuilder.status('failure').code(500).message("Gagal mengambil data").json(error.message);
    }
}