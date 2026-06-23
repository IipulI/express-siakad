import * as pengumumanService from "../../services/pengumuman.service.js";
import ResponseBuilder from "../../utils/response.js";
import { getPagingData } from "../../utils/pagination.js";
import { validationResult } from "express-validator";

export const findAll = async (req, res, next) => {
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

        responseBuilder
            .status("success")
            .code(200)
            .message("Berhasil Menggambil data")
            .json(payload);
    } catch (error) {
        next(error)
    }
};

export const findOneById = async (req, res, next) => {
    const { id } = req.params;
    const responseBuilder = new ResponseBuilder(res);

    try {
      const data = await pengumumanService.findOneById(id);

      responseBuilder
          .status("success")
          .code(200)
          .message("Berhasil Menggambil data")
          .json(data)
    } catch (error) {
        next(error)
    }
}