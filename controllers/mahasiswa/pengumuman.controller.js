import * as pengumumanService from "../../services/pengumuman.service.js";
import ResponseBuilder from "../../utils/response.js";
import { getPagingData } from "../../utils/pagination.js";
import { validationResult } from "express-validator";

export const findAll = async (req, res) => {
  const page = req.query.page ? parseInt(req.query.page) : null;
  const size = req.query.size ? parseInt(req.query.size) : null;
  const responseBuilder = new ResponseBuilder(res);

  try {
    const data = await pengumumanService.findAll(page, size);

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
      .message(error.message || "Terjadi kesalahan yang tidak terduga")
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
      .message("Validasi gagal")
      .json(errors.array());
  }

  try {
    const { siakPegawaiId, judul, isi, isActive, isPriority, banner } =
      req.body;

    await pengumumanService.createPengumuman({
      siakPegawaiId,
      judul,
      isi,
      isActive,
      isPriority,
      banner,
    });

    responseBuilder
      .code(201)
      .message("Data Pengumuman berhasil ditambahkan.")
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
        err.message || "Terjadi kesalahan saat menambahkan data Pengumuman."
      )
      .json();
  }
};

export const updatePengumuman = async (req, res) => {
  const { id } = req.params;
  const { siakPegawaiId, judul, isi, isActive, isPriority, banner } = req.body;
  const responseBuilder = new ResponseBuilder(res);

  if (!judul) {
    return responseBuilder
      .status("failure")
      .code(404)
      .message("At least one field (Judul) is required for update.")
      .json();
  }

  try {
    const isUpdated = await pengumumanService.updatePengumuman(id, {
      siakPegawaiId,
      judul,
      isi,
      isActive,
      isPriority,
      banner,
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
        .message(`Pengumuman with ID ${id} not found or no changes were made.`)
        .json();
    }
  } catch (error) {
    console.error(error);
    return responseBuilder
      .status("failure")
      .code(500)
      .message(
        "Terjadi kesalahan internal server saat memperbarui Pengumuman Models."
      )
      .json();
  }
};

export const deletePengumuman = async (req, res) => {
  const { id } = req.params;
  const responseBuilder = new ResponseBuilder(res);

  try {
    const isDeleted = await pengumumanService.deletePengumuman(id);

    if (isDeleted) {
      return responseBuilder
        .code(200)
        .message(`Data Pengumuman Berhasil Dihapus`)
        .json();
    } else {
      return responseBuilder
        .status("failure")
        .code(404)
        .message(`Pengumuman with ID ${id} not found.`)
        .json();
    }
  } catch (error) {
    console.error(error);
    return responseBuilder
      .status("failure")
      .code(500)
      .message("Terjadi kesalahan internal server saat menghapus Pengumuman.")
      .json();
  }
};
