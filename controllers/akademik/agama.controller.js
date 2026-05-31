import * as agamaService from "../../services/agama.service.js";
import ResponseBuilder from "../../utils/response.js";
import { getPagingData } from "../../utils/pagination.js";

export const findAll = async (req, res, next) => {
  const page = req.query.page ? parseInt(req.query.page) : null;
  const size = req.query.size ? parseInt(req.query.size) : null;
  const responseBuilder = new ResponseBuilder(res);

  try {
    const data = await agamaService.findAll(page, size);

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
        const data = await agamaService.findOneById(id);

        responseBuilder
            .code(200)
            .message("Berhasil Mengambil data")
            .json(data);
    } catch (error) {
        next(error)
    }
}

export const create = async (req, res, next) => {
    const responseBuilder = new ResponseBuilder(res);

    try {
        const data = await agamaService.createAgama(req.body)

        responseBuilder
            .code(201)
            .message("Data agama berhasil ditambahkan")
            .json(data);
    }
    catch (error) {
        next(error)
    }
}

export const update = async (req, res, next) => {
    const { id } = req.params;
    const responseBuilder = new ResponseBuilder(res);

    try {
        const isUpdated = await agamaService.updateAgama(id, req.body)

        responseBuilder
            .status("success")
            .code(200)
            .message("Data agama berhasil diperbarui")
            .json(isUpdated);
    }
    catch (error) {
        next(error)
    }
}

export const destroy = async (req, res, next) => {
    const { id } = req.params;
    const responseBuilder = new ResponseBuilder(res);

    try {
        await agamaService.deleteAgama(id);

        responseBuilder
            .status("success")
            .code(200)
            .message("Data agama berhasil dihapus")
            .json();
    } catch (error) {
        next(error)
    }
}