import * as pendidikanService from "../../services/pendidikan.service.js";
import ResponseBuilder from "../../utils/response.js";
import { getPagingData } from "../../utils/pagination.js";
import { validationResult } from "express-validator";

export const findAll = async (req, res) => {
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
    responseBuilder
      .status("failure")
      .code(500)
      .message(error.message || "Terjadi kesalahan yang tidak diharapkan")
      .json();
  }
};

export const create = async (req, res) => {
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
    if (err.message.includes("already exists")) {
      return responseBuilder
        .status("failure")
        .code(409)
        .message(err.message)
        .json();
    }

    responseBuilder
      .status("failure")
      .code(500)
      .message(
        err.message || "Terjadi kesalahan saat menambahkan data Pendidikan."
      )
      .json();
  }
};

export const updatePendidikan = async (req, res) => {
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
    console.error(error);
    return responseBuilder
      .status("failure")
      .code(500)
      .message(
        "Terjadi kesalahan internal server saat memperbarui Pendidikan Models."
      )
      .json();
  }
};

export const deletePendidikan = async (req, res) => {
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
    console.error(error);
    return responseBuilder
      .status("failure")
      .code(500)
      .message("Terjadi kesalahan internal server saat menghapus Pendidikan.")
      .json();
  }
};
