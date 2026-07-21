import * as transkripService from "../../services/transkrip.service.js";
import ResponseBuilder from "../../utils/response.js";
import { getPagingData } from "../../utils/pagination.js";
import { validationResult } from "express-validator";

export const getTranskrip = async (req, res, next) => {
    const responseBuilder = new ResponseBuilder(res);

    const user = req.user;

    const mahasiswa = user.mahasiswa;

    console.log(user);

    try {
        const mahasiswaId = mahasiswa.id;

        const transkrip = await transkripService.getTranskrip(mahasiswaId);

        responseBuilder
            .code(200)
            .message("Berhasil mengambil data")
            .json(transkrip);
    } catch (error) {
        console.error(error);
        next(error);
    }
};
