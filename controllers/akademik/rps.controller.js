import * as rpsService from "../../services/rps.service.js";
import ResponseBuilder from "../../utils/response.js";
import { getPagingData } from "../../utils/pagination.js";

export const findAll = async (req, res) => {
  const page = req.query.page ? parseInt(req.query.page) : null;
  const size = req.query.size ? parseInt(req.query.size) : null;
  const responseBuilder = new ResponseBuilder(res);

  try {
    const data = await rpsService.findAll(page, size);

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
      .message(error.message || "Kesalahan yang tidak terduga.")
      .json();
  }
};

export const create = async (req, res) => {
  const responseBuilder = new ResponseBuilder(res);

  try {
    await rpsService.createRps(req.body, req.file);

    responseBuilder.code(201).message("Data RPS berhasil ditambahkan").json();
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
      .message(err.message || "Terjadi kesalahan saat menambahkan data RPS.")
      .json();
  }
};

export const updateRps = async (req, res) => {
  const { id } = req.params;
  const responseBuilder = new ResponseBuilder(res);
  const {
    tanggalPenyusunan,
    deskripsiMataKuliah,
    tujuanMataKuliah,
    materiPembelajaran,
    pustakaUtama,
    pustakaPendukung,
    dokumenRps,
  } = req.body;

  // request validation
  if (!deskripsiMataKuliah) {
    return responseBuilder
      .status("failure")
      .code(404)
      .message(
        "Harap isi minimal satu data (Deskripsi Mata Kuliah) untuk update"
      )
      .json();
  }

  try {
    const isUpdated = await rpsService.updateRps(id, req.body);

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
          `Data RPS dengan ID ${id} tidak ditemukan atau tidak ada perubahan yang dilakukan`
        )
        .json();
    }
  } catch (error) {
    responseBuilder
      .status("failure")
      .code(500)
      .message("Terjadi kesalahan yang tidak terduga")
      .json();
  }
};

export const deleteRps = async (req, res) => {
  const { id } = req.params;
  const responseBuilder = new ResponseBuilder(res);

  try {
    const isDeleted = await rpsService.deleteRps(id);

    if (isDeleted) {
      responseBuilder.code(200).message("Berhasil Menghapus data").json();
    } else {
      return responseBuilder
        .status("failure")
        .code(404)
        .message(`Data RPS dengan ID ${id} tidak ditemukan`)
        .json();
    }
  } catch (error) {
    console.error(error);
    return responseBuilder
      .status("failure")
      .code(500)
      .message("Terjadi kesalahan yang tidak terduga")
      .json();
  }
};
