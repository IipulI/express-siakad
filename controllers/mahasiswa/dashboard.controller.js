import * as dashboardMahasiswaService from "../../services/dashboard-mahasiswa.service.js";
import ResponseBuilder from "../../utils/response.js";
import model from "../../models/index.js";

const {
  Mahasiswa
} = model;

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

export const getBiodataMahasiswa = async (req, res, next) => {
    const responseBuilder = new ResponseBuilder(res);
    const user = req.user;
    const mahasiswa = user.mahasiswa;

    try {
        const mahasiswa = await Mahasiswa.findByPk(mahasiswa.id, {
            attributes: ['id', 'nama', 'npm', 'angkatan', 'semester', '']
        })

    } catch (error) {
        console.error(error);
        next(error);
    }
};