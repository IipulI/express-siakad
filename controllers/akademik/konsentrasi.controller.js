import * as konsentrasiService from "../../services/konsentrasi.service.js";
import ResponseBuilder from "../../utils/response.js";
import { validationResult } from "express-validator";

export const findAll = async (req, res, next) => {
  const { programStudiId } = req.query;
  const responseBuilder = new ResponseBuilder(res);

  try {
    const data = await konsentrasiService.findAll(programStudiId);

    responseBuilder.code(200).message("Berhasil mengambil data").json(data);
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
    const { siakProgramStudiId, kode, nama } = req.body;

    await konsentrasiService.createKonsentrasi({
      siakProgramStudiId,
      kode,
      nama,
    });

    responseBuilder
      .code(201)
      .message("Data Konsentrasi berhasil ditambahkan.")
      .json();
  } catch (error) {
    next(error);
  }
};

export const updateKonsentrasi = async (req, res, next) => {
  const { id } = req.params;
  const { siakProgramStudiId, kode, nama } = req.body;
  const responseBuilder = new ResponseBuilder(res);

  try {
    await konsentrasiService.updateKonsentrasi(id, {
      siakProgramStudiId,
      kode,
      nama,
    });

    responseBuilder.status("success").code(200).message("Data berhasil diperbarui").json();
  } catch (error) {
    next(error);
  }
};

export const deleteKonsentrasi = async (req, res, next) => {
  const { id } = req.params;
  const responseBuilder = new ResponseBuilder(res);

  try {
    await konsentrasiService.deleteKonsentrasi(id);

    responseBuilder.code(200).message("Data Konsentrasi berhasil dihapus").json();
  } catch (error) {
    next(error);
  }
};
