import * as penghasilanPekerjaan from "../../services/penghasilan-pekerjaan.service.js";
import ResponseBuilder from "../../utils/response.js";
import { getPagingData } from "../../utils/pagination.js";
import { validationResult } from "express-validator";

export const findAll = async (req, res) => {
  const page = req.query.page ? parseInt(req.query.page) : null;
  const size = req.query.size ? parseInt(req.query.size) : null;
  const responseBuilder = new ResponseBuilder(res);

  try {
    const data = await penghasilanPekerjaan.findAll(page, size);

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
    const { range } = req.body;

    await penghasilanPekerjaan.createPenghasilanPekerjaan({
      range,
    });

    responseBuilder
      .code(201)
      .message("Data Penghasilan Pekerjaan berhasil ditambahkan.")
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
        err.message ||
          "Terjadi kesalahan saat menambahkan data Penghasilan Pekerjaan."
      )
      .json();
  }
};

export const updatePenghasilanPekerjaan = async (req, res) => {
  const { id } = req.params;
  const { range } = req.body;
  const responseBuilder = new ResponseBuilder(res);

  if (!range) {
    return responseBuilder
      .status("failure")
      .code(404)
      .message("At least one field (Range) is required for update.")
      .json();
  }

  try {
    const isUpdated = await penghasilanPekerjaan.updatePenghasilanPekerjaan(
      id,
      {
        range,
      }
    );

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
        .message(
          `Penghasilan Pekerjaan with ID ${id} not found or no changes were made.`
        )
        .json();
    }
  } catch (error) {
    console.error(error);
    return responseBuilder
      .status("failure")
      .code(500)
      .message(
        "Terjadi kesalahan internal server saat memperbarui Penghasilan Pekerjaan Models."
      )
      .json();
  }
};

export const deletePenghasilanPekerjaan = async (req, res) => {
  const { id } = req.params;
  const responseBuilder = new ResponseBuilder(res);

  try {
    const isDeleted = await penghasilanPekerjaan.deletePenghasilanPekerjaan(id);

    if (isDeleted) {
      return responseBuilder
        .code(200)
        .message(`Data Penghasilan Pekerjaan Berhasil Dihapus`)
        .json();
    } else {
      return responseBuilder
        .status("failure")
        .code(404)
        .message(`Penghasilan Pekerjaan with ID ${id} not found.`)
        .json();
    }
  } catch (error) {
    console.error(error);
    return responseBuilder
      .status("failure")
      .code(500)
      .message(
        "Terjadi kesalahan internal server saat menghapus Penghasilan Pekerjaan."
      )
      .json();
  }
};
