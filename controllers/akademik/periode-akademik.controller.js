import * as periodeAkademikService from "../../services/periode-akademik.service.js";
import ResponseBuilder from "../../utils/response.js";
import { getPagingData } from "../../utils/pagination.js";
import { validationResult } from "express-validator";

export const findAll = async (req, res, next) => {
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
      next(error);
    }
};

export const findOne = async (req, res, next) => {
  const { id } = req.params;
  const responseBuilder = new ResponseBuilder(res);

  try {
    const data = await periodeAkademikService.findOneById(id);

    responseBuilder.code(200).message("Berhasil mengambil data").json(data);
  } catch (error) {
      next(error);
    }
};

export const create = async (req, res, next) => {
  const responseBuilder = new ResponseBuilder(res);

  // request validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return responseBuilder
      .status("failure")
      .code(422)
      .message("Validasi gagal")
      .json(errors.array());
  }

  try {
    await periodeAkademikService.createPeriodeAkademik(req.body);

    responseBuilder
      .code(201)
      .message("Data periode akademik berhasil ditambahkan")
      .json();
  } catch (err) {
      next(err);
    }
};

export const updatePeriodeAkademik = async (req, res, next) => {
  const { id } = req.params;
  const { nama, kode, tanggalMulai, tanggalSelesai, status } = req.body;
  const responseBuilder = new ResponseBuilder(res);

  if (!nama || !kode || !tanggalMulai || !tanggalSelesai || !status) {
    return responseBuilder
      .status("failure")
      .code(404)
      .message(
        "Minimal satu field (nama, kode, tanggalMulai, tanggalSelesai, status) wajib diisi untuk pembaruan"
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
        .message("Data berhasil diperbarui")
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
      next(error);
    }
};

export const deletePeriodeAkademik = async (req, res, next) => {
  const { id } = req.params;
  const responseBuilder = new ResponseBuilder(res);

  try {
    const isDeleted = await periodeAkademikService.deletePeriodeAkademik(id);

    if (isDeleted) {
      return res.status(204).end();
    }
    else {
      return responseBuilder
        .status("failure")
        .code(404)
        .message(`Periode Akademik dengan ID ${id} tidak ditemukan`)
        .json();
    }
  }
  catch (error) {
      next(error);
    }
};
