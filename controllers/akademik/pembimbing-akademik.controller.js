import * as pembimbingAkademikService from "../../services/pembiming-akademik.service.js";
import ResponseBuilder from "../../utils/response.js";
import { getPagingData } from "../../utils/pagination.js";

export const getMahasiswa = async (req, res, next) => {
    const responseBuilder = new ResponseBuilder(res)

    try {
        const filters = req.query;

        const mahasiswa = await pembimbingAkademikService.getAllMahasiswaFiltered(filters, null);

        responseBuilder
            .code(200)
            .message("Berhasil mengambil data")
            .json(mahasiswa)

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

    try {
        const { krsIds } = req.body;

        await pembimbingAkademikService.updateKrsMahasiswa(krsIds, "Disetujui")

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

    try {
        const { krsIds } = req.body;

        await pembimbingAkademikService.updateKrsMahasiswa(krsIds, "Ditolak")

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