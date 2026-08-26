import * as ruanganService from "../../services/ruangan.service.js";
import ResponseBuilder from "../../utils/response.js";
import { getPagingData } from "../../utils/pagination.js";
import { validationResult } from "express-validator";

export const findAll = async (req, res, next) => {
  const page = req.query.page ? parseInt(req.query.page) : null;
  const size = req.query.size ? parseInt(req.query.size) : null;
  const responseBuilder = new ResponseBuilder(res);

  try {
    const data = await ruanganService.findAll(page, size);

    let payload;
    if (data.isPaginated === true) {
      payload = getPagingData(data, page, size);
    } else {
      payload = data.rows;
    }

    responseBuilder.code(200).message("Berhasil Menggambil data").json(payload);
  } catch (error) {
      next(error);
    }
};

export const create = async (req, res, next) => {
  const responseBuilder = new ResponseBuilder(res);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return responseBuilder
      .status("failure")
      .code(422)
      .message("Validasi gagal")
      .json(errors.array());
  }

  try {
    const { siakFakultasId, nama, ruangan, kapasitas, lantai } = req.body;

    await ruanganService.createRuangan({
      siakFakultasId,
      nama,
      ruangan,
      kapasitas,
      lantai,
    });

    responseBuilder
      .code(201)
      .message("Data Ruangan berhasil ditambahkan.")
      .json();
  } catch (err) {
      next(err);
    }
};

export const updateRuangan = async (req, res, next) => {
  const { id } = req.params;
  const { siakFakultasId, nama, ruangan, kapasitas, lantai } = req.body;
  const responseBuilder = new ResponseBuilder(res);

  if (!nama && !ruangan) {
    return responseBuilder
      .status("failure")
      .code(404)
      .message("Minimal satu field (Nama atau Ruangan) harus diisi untuk pembaruan")
      .json();
  }

  try {
    const isUpdated = await ruanganService.updateRuangan(id, {
      siakFakultasId,
      nama,
      ruangan,
      kapasitas,
      lantai,
    });

    if (isUpdated) {
      return responseBuilder
        .status("success")
        .code(200)
        .message("Data berhasil diperbarui")
        .json();
    } else {
      return responseBuilder
        .status("failure")
        .code(404)
        .message(`Ruangan dengan ID ${id} tidak ditemukan atau tidak ada perubahan yang dilakukan`)
        .json();
    }
  } catch (error) {
      next(error);
    }
};

export const deleteRuangan = async (req, res, next) => {
  const { id } = req.params;
  const responseBuilder = new ResponseBuilder(res);

  try {
    const isDeleted = await ruanganService.deleteRuangan(id);

    if (isDeleted) {
      return responseBuilder
        .code(200)
        .message(`Data Ruangan Berhasil Dihapus`)
        .json();
    } else {
      return responseBuilder
        .status("failure")
        .code(404)
        .message(`Ruangan dengan ID ${id} tidak ditemukan`)
        .json();
    }
  } catch (error) {
      next(error);
    }
};


export const monitoringRuangan = async (req, res, next) => {
    const { tanggal, fakultasId, programStudiId, dosenId, kapasitasMin, search, page, size } = req.query;
    const responseBuilder = new ResponseBuilder(res);

    try {
        const data = await ruanganService.getMonitoringRuangan({
            tanggal,
            fakultasId,
            programStudiId,
            dosenId,
            kapasitasMin,
            search,
            page,
            size,
        });

        responseBuilder
            .status('success')
            .code(200)
            .message("Berhasil Mengambil data")
            .json(data)
    } catch (error) {
        next(error);
      }
}