import * as sistemKuliahService from '../../services/sistem-kuliah.service.js';
import ResponseBuilder from "../../utils/response.js";
import { getPagingData } from "../../utils/pagination.js";

export const findAll = async (req, res, next) => {
    const responseBuilder = new ResponseBuilder(res)
    const page = req.query.page ? parseInt(req.query.page) : null;
    const size = req.query.size ? parseInt(req.query.size) : null;

    try {
        const data = await sistemKuliahService.findAll(page, size)

        let payload
        if (data.isPaginated) {
            payload = getPagingData(data, page, size)
        } else {
            payload = data.rows
        }

        responseBuilder
            .status('success')
            .message('Berhasil mengambil data')
            .json(payload)
    } catch (error) {
        next(error)
    }
}

export const findOneById = async (req, res, next) => {
    const responseBuilder = new ResponseBuilder(res)
    const id = req.params.id

    try {
        const data = await sistemKuliahService.findOneById(id)

        responseBuilder
            .status('success')
            .message('Berhasil mengambil data')
            .json(data)
    } catch (error) {
        next(error)
    }
}

export const create = async (req, res, next) => {
    const responseBuilder = new ResponseBuilder(res)
    const body = req.body

    try {
        const data = await sistemKuliahService.createSistemKuliah(body)

        responseBuilder
            .status('success')
            .message('Berhasil menambahkan data')
            .json(data)
    } catch (error) {
        next(error)
    }
}

export const update = async (req, res, next) => {
    const responseBuilder = new ResponseBuilder(res)
    const id = req.params.id
    const body = req.body

    try {
        const data = await sistemKuliahService.updateSistemKuliah(id, body)

        responseBuilder
            .status('success')
            .message('Berhasil mengubah data')
            .json(data)
    } catch (error) {
        next(error)
    }
}

export const destroy = async (req, res, next) => {
    const id = req.params.id
    const responseBuilder = new ResponseBuilder(res)

    try {
        await sistemKuliahService.deleteSistemKuliah(id)

        responseBuilder
            .status('success')
            .message('Berhasil menghapus data')
            .json()
    } catch (error) {
        next(error)
    }
}