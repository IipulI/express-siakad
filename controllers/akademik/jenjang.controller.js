import * as jenjangService from "../../services/jenjang.service.js";
import ResponseBuilder from "../../utils/response.js";
import { getPagingData } from "../../utils/pagination.js";
import { validationResult } from "express-validator";

export const findAll = async (req, res) => {
  const page = req.query.page ? parseInt(req.query.page) : null;
  const size = req.query.size ? parseInt(req.query.size) : null;
  const responseBuilder = new ResponseBuilder(res);

  try {
    const data = await jenjangService.findAll(page, size);

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
      .message(error.message || "Unexpected error")
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
      .message("Validation failed.")
      .json(errors.array());
  }

  try {
    const { nama, jenjang } = req.body;

    await jenjangService.createJenjang({
      nama,
      jenjang,
    });

    responseBuilder
      .code(201)
      .message("Data Jenjang berhasil ditambahkan.")
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
        err.message || "Terjadi kesalahan saat menambahkan data Jenjang."
      )
      .json();
  }
};

export const updateJenjang = async (req, res) => {
  const { id } = req.params;
  const { nama, jenjang } = req.body;
  const responseBuilder = new ResponseBuilder(res);

  if (!nama && !jenjang) {
    return responseBuilder
      .status("failure")
      .code(404)
      .message("At least one field (Nama or Jenjang) is required for update.")
      .json();
  }

  try {
    const isUpdated = await jenjangService.updateJenjang(id, {
      nama,
      jenjang,
    });

    if (isUpdated) {
      return responseBuilder
        .status("success")
        .code(200)
        .message("Update data successfully.")
        .json();
    } else {
      return responseBuilder
        .status("failure")
        .code(404)
        .message(`Jenjang with ID ${id} not found or no changes were made.`)
        .json();
    }
  } catch (error) {
    console.error(error);
    return responseBuilder
      .status("failure")
      .code(500)
      .message(
        "Terjadi kesalahan internal server saat memperbarui Jenjang Models."
      )
      .json();
  }
};

export const deleteJenjang = async (req, res) => {
  const { id } = req.params;
  const responseBuilder = new ResponseBuilder(res);

  try {
    const isDeleted = await jenjangService.deleteJenjang(id);

    if (isDeleted) {
      return responseBuilder
        .code(200)
        .message(`Data Jenjang Berhasil Dihapus`)
        .json();
    } else {
      return responseBuilder
        .status("failure")
        .code(404)
        .message(`Jenjang with ID ${id} not found.`)
        .json();
    }
  } catch (error) {
    console.error(error);
    return responseBuilder
      .status("failure")
      .code(500)
      .message("Terjadi kesalahan internal server saat menghapus Jenjang.")
      .json();
  }
};
