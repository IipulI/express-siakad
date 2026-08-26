import * as kebutuhanKhusus from "../../services/kebutuhan-khusus.service.js";
import ResponseBuilder from "../../utils/response.js";
import { getPagingData } from "../../utils/pagination.js";
import { validationResult } from "express-validator";

export const findAll = async (req, res, next) => {
  const page = req.query.page ? parseInt(req.query.page) : null;
  const size = req.query.size ? parseInt(req.query.size) : null;
  const responseBuilder = new ResponseBuilder(res);

  try {
    const data = await kebutuhanKhusus.findAll(page, size);

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
    const { nama } = req.body;

    await kebutuhanKhusus.createKebutuhanKhusus({
      nama,
    });

    responseBuilder
      .code(201)
      .message("Data Kebutuhan Khusus berhasil ditambahkan.")
      .json();
  } catch (err) {
      next(err);
    }
};

export const updateKebutuhanKhusus = async (req, res, next) => {
  const { id } = req.params;
  const { nama } = req.body;
  const responseBuilder = new ResponseBuilder(res);

  if (!nama) {
    return responseBuilder
      .status("failure")
      .code(404)
      .message("Minimal satu kolom (Nama) harus diisi untuk memperbarui data")
      .json();
  }

  try {
    const isUpdated = await kebutuhanKhusus.updateKebutuhanKhusus(id, {
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
        .message(
          `Data Kebutuhan Khusus dengan ID ${id} tidak ditemukan atau tidak ada perubahan`
        )
        .json();
    }
  } catch (error) {
      next(error);
    }
};

export const deleteKebutuhanKhusus = async (req, res, next) => {
  const { id } = req.params;
  const responseBuilder = new ResponseBuilder(res);

  try {
    const isDeleted = await kebutuhanKhusus.deleteKebutuhanKhusus(id);

    if (isDeleted) {
      return responseBuilder
        .code(200)
        .message(`Data Kebutuhan Khusus Berhasil Dihapus`)
        .json();
    } else {
      return responseBuilder
        .status("failure")
        .code(404)
        .message(`Kebutuhan Khusus dengan ID ${id} tidak ditemukan`)
        .json();
    }
  } catch (error) {
      next(error);
    }
};
