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
  NilaiCpmkMahasiswa,
  CapaianMataKuliah,
} = db;

// Susun daftar CPMK datar (dari siak_nilai_cpmk_mahasiswa) jadi hierarki
// CPMK induk -> Sub-CPMK anak, plus status "Memenuhi"/"Belum Memenuhi" vs target.
// Dipakai KHS & Transkrip mahasiswa (detail per mata kuliah), TIDAK mengubah
// field yang sudah ada -- cuma ditambahkan sebagai field baru (capaianCpmk),
// supaya FE yang sudah konsumsi struktur lama tetap jalan seperti biasa.
const susunHirarkiCpmk = (nilaiCpmkRows) => {
  const byId = new Map();
  nilaiCpmkRows.forEach(n => {
    const cpmk = n.capaianMataKuliah;
    if (!cpmk) return;
    byId.set(cpmk.id, {
      kode: cpmk.kode,
      deskripsi: cpmk.deskripsi,
      nilai: n.nilai != null ? parseFloat(n.nilai) : null,
      target: cpmk.target != null ? parseFloat(cpmk.target) : null,
      parentId: cpmk.parentId,
      // Target cuma beneran diisi di level CPMK induk -- Sub-CPMK targetnya 0/kosong
      // di RPS, jadi "Memenuhi/Belum Memenuhi" cuma masuk akal kalau target > 0.
      // Kalau target 0 (kebanyakan Sub-CPMK anak), tampilin "Tanpa Target" -- jangan
      // ikut dibilang "Memenuhi" cuma karena nilai >= 0 (menyesatkan).
      status: n.nilai == null
        ? 'Belum Dinilai'
        : (cpmk.target != null && parseFloat(cpmk.target) > 0)
          ? (parseFloat(n.nilai) >= parseFloat(cpmk.target) ? 'Memenuhi' : 'Belum Memenuhi')
          : 'Tanpa Target',
      subCpmk: [],
    });
  });
  const roots = [];
  byId.forEach(item => {
    if (item.parentId && byId.has(item.parentId)) {
      byId.get(item.parentId).subCpmk.push(item);
    } else {
      roots.push(item);
    }
  });
  roots.forEach(r => { delete r.parentId; r.subCpmk.forEach(s => delete s.parentId); });
  return roots;
};

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
    where: {
      status: { [Op.in]: ['Dikunci', 'Lulus', 'Tidak Lulus'] }
    },
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

  // Tambahan: detail capaian CPMK/Sub-CPMK per mata kuliah -- diisi HANYA kalau
  // ada datanya (kelas yang belum pakai Jalur D/OBE tetap tampil seperti biasa,
  // cuma capaianCpmk-nya array kosong). Ini field BARU, tidak mengubah field
  // yang sudah ada, supaya tidak breaking FE yang sudah konsumsi struktur lama.
  const rincianArray = Array.from(rincianPerKelas.values()).map((item) => item.get({ plain: true }));
  const kelasIds = rincianArray.map((item) => item.kelasKuliah?.id).filter(Boolean);
  if (kelasIds.length > 0) {
    const semuaNilaiCpmk = await NilaiCpmkMahasiswa.findAll({
      where: { siakKelasKuliahId: { [Op.in]: kelasIds }, siakMahasiswaId: mahasiswaId },
      include: [{ model: CapaianMataKuliah, as: 'capaianMataKuliah', attributes: ['id', 'kode', 'deskripsi', 'target', 'parentId'] }],
    });
    const nilaiCpmkPerKelas = new Map();
    semuaNilaiCpmk.forEach((n) => {
      const list = nilaiCpmkPerKelas.get(n.siakKelasKuliahId) || [];
      list.push(n);
      nilaiCpmkPerKelas.set(n.siakKelasKuliahId, list);
    });
    rincianArray.forEach((item) => {
      const rows = nilaiCpmkPerKelas.get(item.kelasKuliah?.id) || [];
      item.capaianCpmk = susunHirarkiCpmk(rows);
    });
  } else {
    rincianArray.forEach((item) => { item.capaianCpmk = []; });
  }

  return {
    hasilStudi: hasilStudi,
    rincianKrs: rincianArray,
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
    where: {
      status: { [Op.in]: ['Dikunci', 'Lulus', 'Tidak Lulus'] }
    },
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
