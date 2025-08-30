import * as JalurPendaftaran from "../../services/jalur-pendaftaran.service.js";
import ResponseBuilder from "../../utils/response.js";
import { getPagingData } from "../../utils/pagination.js";
import { validationResult } from "express-validator";

export const findAll = async (req, res) => {
  const page = req.query.page ? parseInt(req.query.page) : null;
  const size = req.query.size ? parseInt(req.query.size) : null;
  const responseBuilder = new ResponseBuilder(res);

  try {
    const data = await JalurPendaftaran.findAll(page, size);

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
    const { nama } = req.body;

    await JalurPendaftaran.createJalurPendaftaran({
      nama
    });

    responseBuilder
      .code(201)
      .message("Data Jalur Pendaftaran berhasil ditambahkan.")
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
          "Terjadi kesalahan saat menambahkan data Jalur Pendaftaran"
      )
      .json();
  }
};

export const updateJalurPendaftaran = async (req, res) => {
  const { id } = req.params;
  const { nama } = req.body;
  const responseBuilder = new ResponseBuilder(res);

  try {
    const isUpdated = await JalurPendaftaran.updateJalurPendaftaran(id, {
      nama
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
          `Data Jalur Pendaftaran dengan ID ${id} tidak ditemukan atau tidak ada perubahan`
        )
        .json();
    }
  } catch (error) {
    console.error(error);
    return responseBuilder
      .status("failure")
      .code(500)
      .message(
        "Terjadi kesalahan internal server saat memperbarui Jalur Pendaftaran Models."
      )
      .json();
  }
};