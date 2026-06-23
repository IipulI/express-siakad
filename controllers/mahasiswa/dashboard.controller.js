import * as dashboardMahasiswaService from "../../services/dashboard-mahasiswa.service.js";
import ResponseBuilder from "../../utils/response.js";

export const getDashboardMahasiswa = async (req, res, next) => {
  const responseBuilder = new ResponseBuilder(res);
  try {
    const mahasiswaId = req.user.mahasiswa.id;
    const data = await dashboardMahasiswaService.getDashboardMahasiswa(mahasiswaId);

    responseBuilder
      .code(200)
      .message("Berhasil mengambil data dashboard mahasiswa")
      .json(data);
  } catch (error) {
    next(error);
  }
};
