import * as pembimbingAkademikService from "../../services/pembiming-akademik.service.js";
import ResponseBuilder from "../../utils/response.js";
import { getPagingData } from "../../utils/pagination.js";

export const getMahasiswa = async (req, res, next) => {
    const responseBuilder = new ResponseBuilder(res)

    const page = req.query.page ? parseInt(req.query.page) : null;
    const size = req.query.size ? parseInt(req.query.size) : null;

    try {
        const filters = req.query;

        const data = await pembimbingAkademikService.getAllMahasiswaFiltered(filters, null, page, size);

        let payload
        if(data.isPaginated) {
            payload = getPagingData(data, page, size)
        } else {
            payload = data.rows
        }

        responseBuilder
            .status('success')
            .code(200)
            .message("Berhasil")
            .json(payload)
    } catch (error) {
        next(error);
    }
};

export const assignDosen = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res)

    try {
        const { siakDosenId, siakMahasiswaIds, siakPeriodeAkademikId } = req.body;

        const assignDosen = await pembimbingAkademikService.assignDosen(siakDosenId, siakMahasiswaIds, siakPeriodeAkademikId);

        responseBuilder
            .code(201)
            .message("Berhasil update data")
            .json()
    }
    catch (error) {
        responseBuilder
            .status('failure')
            .code(500)
            .message("Terjadi kesalahan")
            .json(error)
    }
}

export const acceptKrsMahasiswa = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res)
    const krsIds = req.body.krsIds ? req.body.krsIds : null;
    const mahasiswaIds = req.body.mahasiswaIds ? req.body.mahasiswaIds : null;
    const periodeAkademikId = req.body.periodeAkademikId ? req.body.periodeAkademikId : null;

    try {
        await pembimbingAkademikService.updateKrsMahasiswa(krsIds, mahasiswaIds, periodeAkademikId, "Disetujui")

        responseBuilder
            .code(200)
            .message("Berhasil update data")
            .json();
    }
    catch (error) {
        console.log(error)
        responseBuilder
            .status('failure')
            .code(500)
            .message("Error")
            .json(error)
    }
}

export const rejectKrsMahasiswa = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res)
    const { krsIds, mahasiswaIds, periodeAkademikId } = req.body;

    try {
        await pembimbingAkademikService.updateKrsMahasiswa(krsIds, mahasiswaIds, periodeAkademikId,"Ditolak")

        responseBuilder
            .code(200)
            .message("Berhasil update data")
            .json();
    }
    catch (error) {
        console.log(error)
        responseBuilder
            .code(500)
            .message("Error")
            .json()
    }
}