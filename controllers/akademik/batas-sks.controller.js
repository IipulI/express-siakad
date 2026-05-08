import * as BatasSks from "../../services/batas-sks.service.js";
import ResponseBuilder from "../../utils/response.js";
import { getPagingData } from "../../utils/pagination.js";
import { validationResult } from "express-validator";

export const findAll = async (req, res, next) => {
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
        const data = await BatasSks.findOneById(id);

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
    const body = req.body;

    try {
        const data = await BatasSks.createBatasSks(body);

        responseBuilder
            .code(201)
            .message("Data Batas Sks berhasil ditambahkan.")
            .json(data);
    } catch (err) {
        next(err)
    }
};

export const updateBatasSks = async (req, res, next) => {
      const { id } = req.params;
      const responseBuilder = new ResponseBuilder(res);

      try {
          const data = await BatasSks.updateBatasSks(id, req.body);

          responseBuilder
              .code(200)
              .message("Data Batas Sks berhasil diperbarui")
              .json(data);
      } catch (error) {
          next(error)
      }
};

export const deleteBatasSks = async (req, res, next) => {
    const responseBuilder = new ResponseBuilder(res)
    const id= req.params.id

    try {
        await BatasSks.deleteBatasSks(id);

        responseBuilder
            .status("success")
            .code(200)
            .message("Data Batas Sks berhasil dihapus")
            .json();
    } catch (error) {
        next(error)
    }
}
