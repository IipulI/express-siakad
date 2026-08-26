import * as pekerjaanService from "../../services/pekerjaan.service.js";
import ResponseBuilder from "../../utils/response.js";
import { getPagingData } from "../../utils/pagination.js";
import { validationResult } from "express-validator";

export const findAll = async (req, res, next) => {
  const page = req.query.page ? parseInt(req.query.page) : null;
  const size = req.query.size ? parseInt(req.query.size) : null;
  const responseBuilder = new ResponseBuilder(res);

  try {
    const data = await pekerjaanService.findAll(page, size);

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
      .message("Data tidak valid")
      .json(errors.array());
  }

  try {
    const { nama } = req.body;

    await pekerjaanService.createPekerjaan({
      nama,
    });

    responseBuilder
      .code(201)
      .message("Data Pekerjaan berhasil ditambahkan.")
      .json();
  } catch (err) {
      next(err);
    }
};

export const updatePekerjaan = async (req, res, next) => {
  const { id } = req.params;
  const { nama } = req.body;
  const responseBuilder = new ResponseBuilder(res);

  if (!nama) {
    return responseBuilder
      .status("failure")
      .code(404)
      .message("Setidaknya satu field (Nama) harus diisi untuk memperbarui data")
      .json();
  }

  try {
    const isUpdated = await pekerjaanService.updatePekerjaan(id, {
      nama,
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
        .message(`Pekerjaan dengan ID ${id} tidak ditemukan atau tidak ada data yang diubah`)
        .json();
    }
  } catch (error) {
      next(error);
    }
};

export const deletePekerjaan = async (req, res, next) => {
  const { id } = req.params;
  const responseBuilder = new ResponseBuilder(res);

  try {
    const isDeleted = await pekerjaanService.deletePekerjaan(id);

    if (isDeleted) {
      return responseBuilder
        .code(200)
        .message(`Data Pekerjaan Berhasil Dihapus`)
        .json();
    } else {
      return responseBuilder
        .status("failure")
        .code(404)
        .message(`Pekerjaan dengan ID ${id} tidak ditemukan.`)
        .json();
    }
  } catch (error) {
      next(error);
    }
};
