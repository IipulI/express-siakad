import * as fakultasService from "../../services/fakultas.service.js";
import ResponseBuilder from "../../utils/response.js";
import { getPagingData } from "../../utils/pagination.js";
import { validationResult } from "express-validator";

export const findAll = async (req, res) => {
  const page = req.query.page ? parseInt(req.query.page) : null;
  const size = req.query.size ? parseInt(req.query.size) : null;
  const responseBuilder = new ResponseBuilder(res);

  try {
    const data = await fakultasService.findAll(page, size);

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
      .message(error.message || "Terjadi kesalah tidak terduga")
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
    await fakultasService.createPeriodeAkademik(req.body);

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
        "Harap isi minimal satu data (nama, kode, tanggal mulai, tanggal selesai, status) untuk update"
      )
      .json();
  }

  try {
    const isUpdated = await fakultasService.updatePeriodeAkademik(id, req.body);

    if (isUpdated) {
      return responseBuilder
        .status("success")
        .code(200)
        .message("Berhasil memperbarui data fakultas")
        .json();
    } else {
      return responseBuilder
        .status("failure")
        .code(404)
        .message(
          `Periode Akademik dengan ID ${id} tidak ditemukan atau tidak ada perubahan yang dilakukan`
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
    const isDeleted = await fakultasService.deletePeriodeAkademik(id);

    if (isDeleted) {
      return res.status(204).end();
    } else {
      return responseBuilder
        .status("failure")
        .code(404)
        .message(`Periode Akademik dengan ID ${id} tidak ditemukan.`)
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
