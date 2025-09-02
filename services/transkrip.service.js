import db from "../models/index.js";
import { Op } from "sequelize";

const {
  HasilStudi,
  KelasKuliah,
  KrsMahasiswa,
  Mahasiswa,
  MataKuliah,
  PeriodeAkademik,
  RincianKrsMahasiswa,
} = db;

export const getTranskrip = async (mahasiswaId) => {
  try {
    const mahasiswa = await Mahasiswa.findByPk(mahasiswaId, {
      attributes: ["id", "nama", "periodeMasuk"],
    });
    if (!mahasiswa) {
      throw new Error(`Mahasiswa dengan Id ${mahasiswaId} tidak ditemukan`);
    }

    const rincianKrsMahasiswa = await RincianKrsMahasiswa.findAll({
      attributes: [
        "id",
        "kehadiran",
        "tugas",
        "uts",
        "uas",
        "nilai",
        "hurufMutu",
        "angkaMutu",
        "nilaiAkhir",
        "siakKelasKuliahId",
      ],
      include: [
        {
          attributes: ["semester"],
          where: {
            siakMahasiswaId: mahasiswaId,
          },
          model: KrsMahasiswa,
          as: "krsMahasiswa",
          required: true,
        },
        {
          attributes: [],
          model: KelasKuliah,
          as: "kelasKuliah",
          include: {
            attributes: ["nama", "kode", "totalSks", "nilai_min"],
            model: MataKuliah,
            as: "mataKuliah",
            where: {
              nilai_min: { [Op.ne]: "D" }, // ✅ ini sama dengan SQL: nilai_min != 'D'
            },
          },
        },
      ],
      raw: true,
    });

    return {
      rincianKrs: rincianKrsMahasiswa,
    };
  } catch (error) {
    console.log(error);
    throw new Error(error.message);
  }
};
