import * as BatasSks from "../../services/batas-sks.service.js";
import ResponseBuilder from "../../utils/response.js";
import { getPagingData } from "../../utils/pagination.js";
import { validationResult } from "express-validator";

export const findAll = async (req, res) => {
  const page = req.query.page ? parseInt(req.query.page) : null;
  const size = req.query.size ? parseInt(req.query.size) : null;
  const responseBuilder = new ResponseBuilder(res);

  try {
    const data = await BatasSks.findAll(page, size);

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
    const { siakJenjangId, ipsMin, ipsMax, batasSks } = req.body;

    await BatasSks.createBatasSks({
      siakJenjangId, ipsMin, ipsMax, batasSks
    });

    responseBuilder
      .code(201)
      .message("Data Batas Sks berhasil ditambahkan.")
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
          "Terjadi kesalahan saat menambahkan data Batas Sks"
      )
      .json();
  }
};

export const updateBatasSks = async (req, res) => {
  const { id } = req.params;
  const { ipsMin, ipsMax, batasSks } = req.body;
  const responseBuilder = new ResponseBuilder(res);

  try {
    const isUpdated = await BatasSks.updateBatasSks(id, {
      ipsMin, ipsMax, batasSks,
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
          `Data Batas Sks dengan ID ${id} tidak ditemukan atau tidak ada perubahan`
        )
        .json();
    }
  } catch (error) {
    console.error(error);
    return responseBuilder
      .status("failure")
      .code(500)
      .message(
        "Terjadi kesalahan internal server saat memperbarui Batas Sks Models."
      )
      .json();
  }
};

export const deleteBatasSks = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res)
    const id= req.params.id
    try {
        const isDeleted = await BatasSks.deleteBatasSks(id);

        if (isDeleted) {
        return responseBuilder
            .code(200)
            .message(`Data Batas Sks Berhasil Dihapus`)
            .json();
        } else {
        return responseBuilder
            .status("failure")
            .code(404)
            .message(`Batas Sks dengan ID ${id} tidak ditemukan`)
            .json();
        }
    } catch (error) {
        console.error(error);
        return responseBuilder
        .status("failure")
        .code(500)
        .message(
            "Terjadi kesalahan internal server saat menghapus Batas Sks."
        )
        .json(error.message);
    };
}
