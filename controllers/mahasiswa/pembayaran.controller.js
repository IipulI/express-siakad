import ResponseBuilder from "../../utils/response.js";
import * as pembayaranService from  "../../services/pembayaran.service.js"

export const getPembayaran = async (req, res, next) => {
    const responseBuilder = new ResponseBuilder(res)
    const user = req.user

    const mahasiswa = user.mahasiswa

    try {
        const data = await pembayaranService.getPembayaranCard(mahasiswa)

        responseBuilder
            .status('success')
            .code(200)
            .message("Berhasil mengambil data")
            .json(data)
    } catch (error) {
        console.error(error)
        next(error)
    }
}

export const getPembayaranAktif = async (req, res, next) => {
    const responseBuilder = new ResponseBuilder(res)
    const user = req.user

    const mahasiswa = user.mahasiswa

    try {
        const data = await pembayaranService.getPembayaranAktif(mahasiswa)

        responseBuilder
            .status('success')
            .code(200)
            .message("Berhasil mengambil data")
            .json(data)
    } catch (error) {
        console.error(error)
        next(error)
    }
}

export const notifyStep = async (req, res, next) => {
    const responseBuilder = new ResponseBuilder(res)
    const user = req.user

    const mahasiswa = user.mahasiswa

    try {
        await pembayaranService.notifyStep3(mahasiswa)

        responseBuilder
            .status('success')
            .code(200)
            .message("Berhasil mengirim notifikasi")
            .json()
    } catch (error) {
        console.error(error)
        next(error)
    }
}