import * as fakultasService from "../../services/fakultas.service.js";
import ResponseBuilder from "../../utils/response.js";
import { getPagingData } from "../../utils/pagination.js";
import { validationResult } from "express-validator";

export const findAll = async (req, res, next) => {
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

        responseBuilder
            .code(200)
            .message("Berhasil Menggambil data")
            .json(payload);
    } catch (error) {
        next(error)
    }
};

export const findOneById = async (req, res, next) => {
    const id = req.params.id;
    const responseBuilder = new ResponseBuilder(res);

    try {
        const data = await fakultasService.findOneById(id);

        responseBuilder
            .code(200)
            .message("Berhasil Mengambil data")
            .json(data);
    } catch (error) {
        next(error)
    }
}

export const createFakultas = async (req, res, next) => {
    const responseBuilder = new ResponseBuilder(res);
    const body = req.body;

    try {
        const data = await fakultasService.createFakultas(body);

        return responseBuilder
            .status('success')
            .code(201)
            .message('Fakultas berhasil ditambahkan')
            .json(data);
    } catch (error) {
        next(error)
    }
};

export const updateFakultas = async (req, res, next) => {
  const responseBuilder = new ResponseBuilder(res);
  const { id } = req.params;
  const body = req.body;

  try {
      const data = await fakultasService.updateFakultas(id, body)

      responseBuilder
          .status('success')
          .code(200)
          .message('Fakultas berhasil diperbarui')
          .json(data)
  } catch (error) {
      next(error)
  }
};

export const deleteFakultas = async (req, res, next) => {
    const { id } = req.params;
    const responseBuilder = new ResponseBuilder(res);

    try {
        await fakultasService.deleteFakultas(id);

        responseBuilder
            .status('success')
            .code(200)
            .message('Fakultas berhasil dihapus')
            .json();
    } catch (error) {
        next(error)
    }
};
