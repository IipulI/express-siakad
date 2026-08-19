import * as KrsMahasiswaService from "../../services/krs-mahasiswa.service.js";
import * as riwayatKrsService from "../../services/riwayat-krs.service.js";
import ResponseBuilder from "../../utils/response.js";
import { getPagingData } from "../../utils/pagination.js";

export const getAvailableKrs = async (req, res, next) => {
  const responseBuilder = new ResponseBuilder(res);

  try {
    const user = req.user;
    const mahasiswa = user.mahasiswa;
    let semesters;

    // Get optional filter parameters from the URL query string
    const { search } = req.query;

    if (mahasiswa.semester % 2 === 0) {
      semesters = [2, 4, 6, 8, 10, 12, 14];
    } else {
      semesters = [1, 3, 5, 7, 9, 11, 13, 15];
    }

    // Call the service with all the necessary parameters
    const courses = await KrsMahasiswaService.getAvailableKrs(
      mahasiswa.id,
      search,
      semesters
    );

    // Send a successful response
    responseBuilder
      .code(200)
      .message("Successfully retrieve data")
      .json(courses);
  } catch (error) {
    console.error(error)
    next(error)
  }
};

export const infoKrs = async (req, res, next) => {
  const responseBuilder = new ResponseBuilder(res)
  const mahasiswa = req.user.mahasiswa

  try {
    const data = await KrsMahasiswaService.infoKrs(mahasiswa.id)

    responseBuilder
        .status('success')
        .code(200)
        .message("Successfully retrieve data")
        .json(data)
  } catch (error) {
    console.error(error)
    next(error)
  }
}

export const saveKrs = async (req, res, next) => {
  const responseBuilder = new ResponseBuilder(res);
  const kelasKuliahIds = req.body.kelasKuliahIds;

  try {
    const user = req.user;
    const mahasiswa = user.mahasiswa;

    const data = await KrsMahasiswaService.saveKrs(
      mahasiswa.id,
      kelasKuliahIds
    );

    responseBuilder.code(201).message("Successfully update data").json(data);
  } catch (error) {
    console.error(error)
    next(error)
  }
};

export const submitKrs = async (req, res, next) => {
  const responseBuilder = new ResponseBuilder(res);

  try {
    const user = req.user;
    const mahasiswa = user?.mahasiswa;

    const updateData = await KrsMahasiswaService.submitKrs(
      mahasiswa.id
    );

    console.log(updateData);

    if (updateData) {
      responseBuilder.code(200).message("Berhasil mengajukan krs").json();
    } else {
      responseBuilder
        .status("failure")
        .code(500)
        .message("Gagal mengajukan krs");
    }
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const updateKrs = async (req, res, next) => {
  const responseBuilder = new ResponseBuilder(res);
  const kelasKuliahIds = req.body.kelasKuliahIds;
  const user = req.user;
  const mahasiswa = user?.mahasiswa;

  try {
    const data = await KrsMahasiswaService.updateKrs(
        mahasiswa.id,
        kelasKuliahIds
    );

    responseBuilder.code(201).message("Successfully update data").json(data);
  } catch (error) {
    console.log("Error in handleSaveKrs:", error);
    next(error);
  }
};

export const deleteKrs = async (req, res, next) => {
  const responseBuilder = new ResponseBuilder(res);
  const kelasKuliahIds = req.body.kelasKuliahIds;
  const krsId = req.params.id;

  try {
    await KrsMahasiswaService.deleteKrs(krsId, kelasKuliahIds);

    responseBuilder.code(200).message("Successfully delete data").json();
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const savedKrs = async (req, res, next) => {
  const responseBuilder = new ResponseBuilder(res);
  try {
    const user = req.user;
    const mahasiswa = user.mahasiswa;

    const savedStudentKrs = await KrsMahasiswaService.savedKrs(mahasiswa.id);

    responseBuilder
      .code(200)
      .message("Successfully retrieve data")
      .json(savedStudentKrs);
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const getKrsHistory = async (req, res, next) => {
  const responseBuilder = new ResponseBuilder(res);

  const user = req.user;

  const mahasiswa = user.mahasiswa;

  console.log(user);

  try {
    const mahasiswaId = mahasiswa.id;
    const periodeId = req.query.periodeId;
    console.log("periodeId diterima:", periodeId); // 👈 log
    console.log("mahasiswaId diterima:", mahasiswaId);

    console.log(periodeId);

    const riwayatKrs = await riwayatKrsService.getRiwayatKrs(
      mahasiswaId,
      periodeId
    );

    responseBuilder
      .code(200)
      .message("Berhasil mengambil data")
      .json(riwayatKrs);
  } catch (error) {
    console.error(error)
    next(error)
  }
};
