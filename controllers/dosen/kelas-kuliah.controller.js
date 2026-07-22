import * as kelasKuliahService from '../../services/kelas-kuliah.service.js'
import ResponseBuilder from "../../utils/response.js";
import { getPagingData } from "../../utils/pagination.js";
import { detailClass } from "../../services/kelas-kuliah.service.js";

export const getKelasKuliah = async (req, res, next) => {
    const responseBuilder = new ResponseBuilder(res)
    const page = req.query.page ? parseInt(req.query.page) : null;
    const size = req.query.size ? parseInt(req.query.size) : null;
    const siakPeriodeAkademikId = req.query.siakPeriodeAkademikId ? req.query.siakPeriodeAkademikId : '';
    const siakProgramStudiId = req.query.siakProgramStudiId ? req.query.siakProgramStudiId : '';
    const sistemKuliah = req.query.sistemKuliah ? req.query.sistemKuliah : '';
    const siakTahunKurikulumId = req.query.siakTahunKurikulumId ? req.query.siakTahunKurikulumId : '';

    const user = req.user
    const siakDosenId = user.dosen.id

    const filter = {
        siakDosenId,
        siakPeriodeAkademikId,
        siakProgramStudiId,
        sistemKuliah,
        siakTahunKurikulumId,
    }

    if (siakPeriodeAkademikId === '') { filter.isActive = 'true' }

    try {
        const data = await kelasKuliahService.findAll(page, size, filter)

        let payload
        if (data.isPaginated) {
            payload = getPagingData(data, page, size)
        } else {
            payload = data.rows
        }

        responseBuilder
            .status('success')
            .message("Berhasil mengambil data")
            .json(payload)
    } catch (error) {
        console.error(error)
        next(error)
    }
}

export const getDetailKelasKuliah = async (req, res, next) => {
    const { id } = req.params
    const responseBuilder = new ResponseBuilder(res)

     try {
        const data = await kelasKuliahService.detailClass(id)

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

export const getPesertaKelasKuliah = async (req, res, next) => {
    const responseBuilder = new ResponseBuilder(res)
    const id= req.params.id

    try {
        const data = await kelasKuliahService.classParticipant(id)

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

export const getGradingKelasKuliah = async (req, res, next) => {
    const responseBuilder = new ResponseBuilder(res)
    const id = req.params.id

    try {
        const data = null

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