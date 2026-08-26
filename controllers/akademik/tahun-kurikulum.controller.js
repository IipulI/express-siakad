import * as tahunKurikulumService from "../../services/tahun-kurikulum.service.js"
import ResponseBuilder from "../../utils/response.js";
import {getPagingData} from "../../utils/pagination.js";
import {validationResult} from "express-validator";


export const findAll = async (req, res, next) => {
    const page = req.query.page ? parseInt(req.query.page) : null;
    const size = req.query.size ? parseInt(req.query.size) : null;
    const responseBuilder = new ResponseBuilder(res);

    try {
        const data = await tahunKurikulumService.findAll(page, size)

        let payload;
        if(data.isPaginated === true) {
            payload = getPagingData(data, page, size);
        } else {
            payload = data.rows
        }

        responseBuilder
            .code(200)
            .message("Berhasil menggambil data")
            .json(payload)
    }
    catch (err) {
        next(err);
      }
}

export const create = async (req, res, next) => {
    const responseBuilder = new ResponseBuilder(res);

    // request validation
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return responseBuilder
            .status('failure')
            .code(422)
            .message("Validasi gagal")
            .json(errors.array());
    }

    try {
        await tahunKurikulumService.createTahunKurikulum(req.body)

        responseBuilder
            .code(201)
            .message("Data periode akademik berhasil ditambahkan")
            .json();
    }
    catch (err) {
        next(err);
      }
}

export const update = async (req, res, next) => {
    const { id } = req.params;
    const responseBuilder = new ResponseBuilder(res);
    const { tahun, nama, keterangan, tanggalMulai, tanggalSelesai } = req.body;

    // request validation
    if (!tahun || !nama || !keterangan || !tanggalMulai || !tanggalSelesai) {
        return responseBuilder
            .status('failure')
            .code(404)
            .message("Minimal satu kolom (tahun, nama, keterangan, tanggal mulai, tanggal selesai) harus diisi untuk memperbarui data")
            .json();
    }

    try {
        const isUpdated = await tahunKurikulumService.updateTahunKurikulum(req.body)

        if (isUpdated) {
            return responseBuilder.status('success')
                .code(200)
                .message("Data berhasil diperbarui")
                .json();
        } else {
            return responseBuilder
                .status('failure')
                .code(404)
                .message(`Tahun kurikulum dengan ID ${id} tidak ditemukan atau tidak ada perubahan yang dilakukan`)
                .json();
        }
    }
    catch (error) {
        next(error);
      }
}

export const destroy = async (req, res, next) => {
    const { id } = req.params;
    const responseBuilder = new ResponseBuilder(res);

    try {
        const isDeleted = await tahunKurikulumService.deleteTahunKurikulum(id);

        if (isDeleted) {
            return res.status(204).end();
        }
        else {
            return responseBuilder
                .status('failure')
                .code(404)
                .message(`Tahun Kurikulum dengan ID ${id} tidak ditemukan`)
                .json();
        }
    } catch (error) {
        next(error);
      }
}