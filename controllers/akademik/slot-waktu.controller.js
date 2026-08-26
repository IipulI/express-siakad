import * as slotWaktuService from "../../services/slot-waktu.service.js";
import ResponseBuilder from "../../utils/response.js";
import { getPagingData } from "../../utils/pagination.js";
import { validationResult } from "express-validator";

export const findAll = async (req, res, next) => {
  const page = req.query.page ? parseInt(req.query.page) : null;
  const size = req.query.size ? parseInt(req.query.size) : null;
  const responseBuilder = new ResponseBuilder(res);

  try {
    const data = await slotWaktuService.findAll(page, size);

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

export const findOneById = async (req, res, next) => {
  const { id } = req.params;
  const responseBuilder = new ResponseBuilder(res);

  try {
    const data = await slotWaktuService.findOneById(id);

    responseBuilder.code(200).message("Berhasil Mengambil data").json(data);
  } catch (error) {
    next(error);
  }
};

export const create = async (req, res, next) => {
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
    const data = await slotWaktuService.createSlotWaktu(req.body);

    responseBuilder
      .code(201)
      .message("Data Slot Waktu berhasil ditambahkan.")
      .json(data);
  } catch (error) {
    next(error);
  }
};

export const update = async (req, res, next) => {
  const { id } = req.params;
  const responseBuilder = new ResponseBuilder(res);

  try {
    const data = await slotWaktuService.updateSlotWaktu(id, req.body);

    responseBuilder
      .status("success")
      .code(200)
      .message("Data berhasil diperbarui")
      .json(data);
  } catch (error) {
    next(error);
  }
};

export const destroy = async (req, res, next) => {
  const { id } = req.params;
  const responseBuilder = new ResponseBuilder(res);

  try {
    await slotWaktuService.deleteSlotWaktu(id);

    responseBuilder
      .status("success")
      .code(200)
      .message("Data Slot Waktu berhasil dihapus")
      .json();
  } catch (error) {
    next(error);
  }
};
