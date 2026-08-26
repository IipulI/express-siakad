import * as pendidikanService from "../../services/pendidikan.service.js";
import ResponseBuilder from "../../utils/response.js";
import { getPagingData } from "../../utils/pagination.js";
import { validationResult } from "express-validator";

export const findAll = async (req, res, next) => {
  const page = req.query.page ? parseInt(req.query.page) : null;
  const size = req.query.size ? parseInt(req.query.size) : null;
  const responseBuilder = new ResponseBuilder(res);

  try {
    const data = await pendidikanService.findAll(page, size);

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
    const { nama, jenjang } = req.body;

    await pendidikanService.createPendidikan({
      nama,
      jenjang,
    });

    responseBuilder
      .code(201)
      .message("Data Pendidikan berhasil ditambahkan.")
      .json();
  } catch (err) {
      next(err);
    }
};

export const updatePendidikan = async (req, res, next) => {
  const { id } = req.params;
  const { nama, jenjang } = req.body;
  const responseBuilder = new ResponseBuilder(res);

  if (!nama && !jenjang) {
    return responseBuilder
      .status("failure")
      .code(404)
      .message("Minimal satu field (Nama atau Jenjang) harus diisi untuk melakukan pembaruan")
      .json();
  }

  try {
    const isUpdated = await pendidikanService.updatePendidikan(id, {
      nama,
      jenjang,
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
        .message(`Pendidikan dengan ID ${id} tidak ditemukan atau tidak ada perubahan yang dilakukan`)
        .json();
    }
  } catch (error) {
      next(error);
    }
};

export const deletePendidikan = async (req, res, next) => {
  const { id } = req.params;
  const responseBuilder = new ResponseBuilder(res);

  try {
    const isDeleted = await pendidikanService.deletePendidikan(id);

    if (isDeleted) {
      return responseBuilder
        .code(200)
        .message(`Data Pendidikan Berhasil Dihapus`)
        .json();
    } else {
      return responseBuilder
        .status("failure")
        .code(404)
        .message(`Pendidikan dengan ID ${id} tidak ditemukan`)
        .json();
    }
  } catch (error) {
      next(error);
    }
};
