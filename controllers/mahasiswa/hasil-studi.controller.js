import * as hasilStudiService from "../../services/hasil-studi.service.js";
import ResponseBuilder from "../../utils/response.js";
import { getPagingData } from "../../utils/pagination.js";
import { validationResult } from "express-validator";

export const getHasilStudi = async (req, res) => {
  const responseBuilder = new ResponseBuilder(res);

  const user = req.user;

  const mahasiswa = user.mahasiswa;

  console.log(user);

  try {
    const mahasiswaId = mahasiswa.id;
    const periodeId = req.query.periodeId;

    const hasilStudi = await hasilStudiService.getHasilStudi(
      mahasiswaId,
      periodeId
    );

    responseBuilder
      .code(200)
      .message("Berhasil mengambil data")
      .json(hasilStudi);
  } catch (error) {
    responseBuilder
      .status("failure")
      .code(500)
      .message("Gagal mengambil data")
      .json(error.message);
  }
};

export const getHistoryHasilStudi = async (req, res, next) => {
    const responseBuilder = new ResponseBuilder(res)

    try {
        const data = await hasilStudiService

        responseBuilder
            .status('success')
            .code(200)
            .message("Berhasil mengambil data")
            .json(data)

    } catch (error) {
        next(error)
    }
};