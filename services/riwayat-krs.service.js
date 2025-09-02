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
  BatasSks,
} = db;

export const getRiwayatKrs = async (mahasiswaId, periodeId) => {
  try {
    const mahasiswa = await Mahasiswa.findByPk(mahasiswaId, {
      attributes: ["id", "nama", "periodeMasuk"],
    });
    if (!mahasiswa) {
      throw new Error(`Mahasiswa dengan Id ${mahasiswaId} tidak ditemukan`);
    }

    const periodeAkademik = await PeriodeAkademik.findByPk(periodeId, {
      attributes: ["id", "kode"],
    });
    if (!periodeAkademik) {
      throw new Error(`Periode akademik tidak ditemukan`);
    }

    const hasilStudi = await HasilStudi.findOne({
      attributes: ["semester", "ips", "ipk", "sksDiambil", "sksLulus"],
      where: {
        // siak_mahasiswa_id: mahasiswaId,
        siak_periode_akademik_id: periodeId,
      },
    });
    if (!hasilStudi) {
      throw new Error(`Hasil studi tidak ditemukan`);
    }

    const batasSks = await BatasSks.findOne({
      attributes: ["batas_sks"],
      where: {
        ips_min: { [Op.gte]: hasilStudi.ips },
      },
    });

    // const rincianKrsMahasiswa = await RincianKrsMahasiswa.findAll({
    //   attributes: [
    //     "id",
    //     "kehadiran",
    //     "tugas",
    //     "uts",
    //     "uas",
    //     "nilai",
    //     "hurufMutu",
    //     "angkaMutu",
    //     "nilaiAkhir",
    //     "siakKelasKuliahId",
    //   ],
    //   include: [
    //     {
    //       attributes: [],
    //       where: {
    //         siakMahasiswaId: mahasiswaId,
    //         siakPeriodeAkademikId: periodeId,
    //       },
    //       model: KrsMahasiswa,
    //       as: "krsMahasiswa",
    //       required: true,
    //     },
    //     {
    //       attributes: [],
    //       model: KelasKuliah,
    //       as: "kelasKuliah",
    //       include: {
    //         attributes: ["nama", "kode", "totalSks"],
    //         model: MataKuliah,
    //         as: "mataKuliah",
    //       },
    //     },
    //   ],
    //   raw: true,
    // });

    return {
      riwayatSks: hasilStudi,
      batasSks: batasSks,
    };
  } catch (error) {
    console.log(error);
    throw new Error(error.message);
  }
};
