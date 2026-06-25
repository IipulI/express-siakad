import db from "../models/index.js";
import { NotFoundError } from "../utils/custom-error.js";
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
        attributes: ['id', 'nama'],
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

  // Dedup per kelas: kalau mahasiswa kebetulan punya >1 baris RincianKrsMahasiswa
  // untuk kelas yang sama (data KRS duplikat), jangan tampilkan 2x di KHS -- pakai
  // pola yang sama dengan getPesertaKelasList (prioritaskan baris yang ada nilainya).
  const rincianPerKelas = new Map();
  rincianKrsMahasiswa.forEach((item) => {
    const kelasId = item.kelasKuliah?.id;
    if (!kelasId) return;
    const existing = rincianPerKelas.get(kelasId);
    if (!existing || (item.nilaiAkhir != null && existing.nilaiAkhir == null)) {
      rincianPerKelas.set(kelasId, item);
    }
  });

  return {
    hasilStudi: hasilStudi,
    rincianKrs: Array.from(rincianPerKelas.values()),
  };
};

export const historyHasilStudi = async (mahasiswaId) => {
    const mahasiswa = await Mahasiswa.findByPk(mahasiswaId)
    if (!mahasiswa) {
        throw new NotFoundError(`Mahasiswa tidak dapat ditemukan`)
    }

    const hasilStudi = await HasilStudi.findAll({
        attributes: {
            exclude: ['createdAt', 'updatedAt', 'deletedAt']
        },
        where: {
            siakMahasiswaId: mahasiswaId
        },
        order: [['semester', 'ASC']],
        include: [
            {
                model: PeriodeAkademik,
                as: 'periodeAkademik',
                attributes: ['id', 'nama', 'kode'],
            },
            {
                model: Mahasiswa,
                as: 'mahasiswa',
                attributes: ['id', 'nama', 'npm'],
            }
        ]
    })

    return {
        hasilStudi: hasilStudi,
    }
}

export const getIpk = async (mahasiswaId) => {
  const mahasiswa = await Mahasiswa.findByPk(mahasiswaId, {
    attributes: ['id', 'nama', 'periodeMasuk'],
  })

  if (!mahasiswa) {
    throw new NotFoundError(`Mahasiswa tidak dapat ditemukan`)
  }

  const hasilStudi = await HasilStudi.findAll({
    attributes: ['semester', 'ips', 'ipk', 'sksDiambil', 'sksLulus'],
    where: {
      siakMahasiswaId: mahasiswaId
    },
    include: {
      model: PeriodeAkademik,
      as: 'periodeAkademik',
      attributes: ['id', 'kode', 'nama']
    },
    order: [
      ['semester', 'ASC']
    ]
  })

  let totalMutu = 0;
  let totalSks = 0;

  const riwayatCalculated = hasilStudi.map(item => {
    const data = item.toJSON();
    const ips = parseFloat(data.ips);
    const sks = parseInt(data.sksDiambil);

    totalMutu += (ips * sks);
    totalSks += sks;

    const calculatedIpk = totalSks > 0 ? (totalMutu / totalSks).toFixed(2) : "0.00";

    return {
      ...data,
      ipk: calculatedIpk // override with calculated IPK
    };
  });

  const finalIpk = riwayatCalculated.length > 0 ? riwayatCalculated[riwayatCalculated.length - 1].ipk : "0.00";

  return {
    ipk: finalIpk,
    riwayat: riwayatCalculated
  };
};

export const getKkn = async (mahasiswaId) => {
  const mahasiswa = await Mahasiswa.findByPk(mahasiswaId, {
    attributes: ['id', 'nama', 'periodeMasuk'],
  });

  if (!mahasiswa) {
    throw new NotFoundError(`Mahasiswa tidak dapat ditemukan`);
  }

  const kknMataKuliah = await RincianKrsMahasiswa.findAll({
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
    ],
    include: [
      {
        attributes: ['id', 'siakPeriodeAkademikId', 'semester'],
        where: {
          siakMahasiswaId: mahasiswaId,
        },
        model: KrsMahasiswa,
        as: "krsMahasiswa",
        required: true,
        include: [
          {
            model: PeriodeAkademik,
            as: "periodeAkademik",
            attributes: ['id', 'nama', 'kode']
          }
        ]
      },
      {
        attributes: ['id', 'nama'],
        model: KelasKuliah,
        as: "kelasKuliah",
        required: true,
        include: {
          attributes: ["nama", "kode", "totalSks"],
          model: MataKuliah,
          as: "mataKuliah",
          required: true,
          where: {
            jenis: {
              [Op.like]: '%KKN%'
            }
          }
        },
      },
    ]
  });

  // Dedup per kelas: pola sama dengan getHasilStudi/getTranskrip -- kalau
  // mahasiswa kebetulan punya >1 baris RincianKrsMahasiswa untuk kelas KKN
  // yang sama, jangan tampil 2x, prioritaskan baris yang ada nilainya.
  const kknPerKelas = new Map();
  kknMataKuliah.forEach((item) => {
    const kelasId = item.kelasKuliah?.id;
    if (!kelasId) return;
    const existing = kknPerKelas.get(kelasId);
    if (!existing || (item.nilaiAkhir != null && existing.nilaiAkhir == null)) {
      kknPerKelas.set(kelasId, item);
    }
  });

  return Array.from(kknPerKelas.values());
};
