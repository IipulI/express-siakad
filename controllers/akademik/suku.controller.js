import * as sukuService from "../../services/suku.servise.js";
import ResponseBuilder from "../../utils/response.js";
import { getPagingData } from "../../utils/pagination.js";
import { BadRequestError } from "../../utils/custom-error.js";

export const findAll = async (req, res, next) => {
  const page = req.query.page ? parseInt(req.query.page) : null;
  const size = req.query.size ? parseInt(req.query.size) : null;
  const responseBuilder = new ResponseBuilder(res);

  try {
    const data = await sukuService.findAll(page, size);

    let payload;
    if (data.isPaginated === true) {
      payload = getPagingData(data, page, size);
    } else {
      payload = data.rows;
    }

    responseBuilder.code(200).message("Berhasil Menggambil data").json(payload);
  } catch (error) {
    next(error)
  }
};

export const create = async (req, res, next) => {
    const responseBuilder = new ResponseBuilder(res);

    try {
        const data = await sukuService.createSuku(req.body)

        responseBuilder
            .code(201)
            .message("Data suku berhasil ditambahkan")
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
        if (!req.body.nama) {
            throw new BadRequestError("Harap isi minimal satu data (nama) untuk melakukan update")
        }

        const isUpdated = await sukuService.updateSuku(id, req.body)

        responseBuilder
            .status("success")
            .code(200)
            .message("Data suku berhasil diperbarui")
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
        await sukuService.deleteSuku(id);

        responseBuilder
            .status("success")
            .code(200)
            .message("Data suku berhasil dihapus")
            .json();
    } catch (error) {
        next(error)
    }
}
