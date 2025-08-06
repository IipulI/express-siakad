import * as periodeAkademikService from "../../services/periode-akademik.service.js";
import ResponseBuilder from "../../utils/response.js";
import { getPagingData } from "../../utils/pagination.js";
import { validationResult } from "express-validator";
import * as tahunAjaranService from "../../services/tahun-ajaran.service.js";
import { getPagingData } from "../../utils/pagination.js";
import { validationResult } from "express-validator";

export const findAll = async (req, res) => {
  const page = req.query.page ? parseInt(req.query.page) : null;
  const size = req.query.size ? parseInt(req.query.size) : null;
  const responseBuilder = new ResponseBuilder(res);

  try {
    const data = await periodeAkademikService.findAll(page, size);

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

  // request validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return responseBuilder
      .status("failure")
      .code(422)
      .message("validation failed.")
      .json(errors.array());
  }

  try {
    await periodeAkademikService.createPeriodeAkademik(req.body);

    responseBuilder
      .code(201)
      .message("Data periode akademik berhasil ditambahkan")
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
        err.message || "Terjadi kesalahan saat menambahkan data Tahun Ajaran."
      )
      .json();
  }
};

export const updatePeriodeAkademik = async (req, res) => {
  const { id } = req.params;
  const { nama, kode, tanggalMulai, tanggalSelesai, status } = req.body;
  const responseBuilder = new ResponseBuilder(res);

  if (!nama || !kode || !tanggalMulai || !tanggalSelesai || !status) {
    return responseBuilder
      .status("failure")
      .code(404)
      .message(
        "At least one field (nama, kode, tanggalMulai, tanggalSelesai, status) is required for update."
      )
      .json();
  }

  try {
    const isUpdated = await periodeAkademikService.updatePeriodeAkademik(
      id,
      req.body
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
          `Periode Akademik with ID ${id} not found or no changes were made.`
        )
        .json();
    }
  } catch (error) {
    console.error(error);
    return responseBuilder
      .status("failure")
      .code(500)
      .message(
        "Terjadi kesalahan internal server saat memperbarui Periode Akademik."
      )
      .json();
  }
};

export const deletePeriodeAkademik = async (req, res) => {
  const { id } = req.params;
  const responseBuilder = new ResponseBuilder(res);

  try {
    const isDeleted = await periodeAkademikService.deletePeriodeAkademik(id);

    if (isDeleted) {
      return res.status(204).end();
    } else {
      return responseBuilder
        .status("failure")
        .code(404)
        .message(`Periode Akademik with ID ${id} not found.`)
        .json();
    }
  } catch (error) {
    console.error(error);
    return responseBuilder
      .status("failure")
      .code(500)
      .message(
        "Terjadi kesalahan internal server saat menghapus Periode Akademik."
      )
      .json();
  }
};
