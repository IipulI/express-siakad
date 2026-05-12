import db from "../models/index.js";
import { NotFoundError } from "../utils/custom-error.js";

const {
  HasilStudi,
  KelasKuliah,
  KrsMahasiswa,
  Mahasiswa,
  MataKuliah,
  PeriodeAkademik,
  RincianKrsMahasiswa,
} = db;

export const getHasilStudi = async (mahasiswaId, periodeId) => {
  const mahasiswa = await Mahasiswa.findByPk(mahasiswaId, {
    attributes: ['id', 'nama', 'periodeMasuk'],
  })

  if (!mahasiswa) {
    throw new NotFoundError(`Mahasiswa tidak dapat ditemukan`)
  }

  const periodeAkademik = await PeriodeAkademik.findByPk(periodeId, {
    attributes: ['id', 'kode'],
  })
  if (!periodeAkademik) {
    throw new NotFoundError(`Periode Akademik tidak dapat ditemukan`)
  }

  const hasilStudi = await HasilStudi.findOne({
    attributes: ['semester', 'ips', 'ipk', 'sksDiambil', 'sksLulus'],
    where: {
      siakMahasiswaId: mahasiswaId,
      siakPeriodeAkademikId: periodeId
    }
  })
  if (!hasilStudi) {
    throw new NotFoundError(`Hasil Studi tidak dapat ditemukan`)
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
        attributes: [],
        where: {
          siakMahasiswaId: mahasiswaId,
          siakPeriodeAkademikId: periodeId,
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
          attributes: ["nama", "kode", "totalSks"],
          model: MataKuliah,
          as: "mataKuliah",
        },
      },
    ]
  });

  return {
    hasilStudi: hasilStudi,
    rincianKrs: rincianKrsMahasiswa,
  };
};
