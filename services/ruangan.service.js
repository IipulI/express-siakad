import models from "../models/index.js";
import { getPagination } from "../utils/pagination.js";
import { BadRequestError, ConflictError, NotFoundError } from "../utils/custom-error.js";
import { Op } from "sequelize";
import { resolveUnitKerjaIds } from "./unit-kerja.service.js";

const {
    Dosen,
    Fakultas,
    JadwalKuliah,
    KelasKuliah,
    MataKuliah,
    ProgramStudi,
    Ruangan
} = models;

export const findAll = async (page, size) => {
  const isPaginated = page !== null && size !== null;

  let queryBuilder = {
    attributes: [
      "id",
      "siakFakultasId",
      "nama",
      "ruangan",
      "kapasitas",
      "lantai",
    ],
    order: [["ruangan", "DESC"]],
  }

  if (isPaginated) {
    const { limit, offset } = getPagination(page, size);
    queryBuilder.limit = limit;
    queryBuilder.offset = offset;

    const { count, rows } = await Ruangan.findAndCountAll(queryBuilder);

    return {
      count,
      rows,
      isPaginated: true,
    }
  } else {
    const data = await Ruangan.findAll(queryBuilder);

    return {
      count: data.length,
      rows: data,
      isPaginated: false,
    }
  }
};

export const createRuangan = async (ruanganData) => {
    const { ruangan } = ruanganData;

    const existingRuangan = await Ruangan.findOne({
        where: {
            ruangan
        }
    })
    if (existingRuangan) {
        throw new ConflictError(`Ruangan : ${ruangan} sudah ada`)
    }

    return await Ruangan.create(ruanganData);
};

export const updateRuangan = async (id, updateData) => {
    const { siakFakultasId, nama, ruangan, kapasitas, lantai } = updateData;

    const cekDataRuangan = await Ruangan.findByPk(id)
    if (!cekDataRuangan) {
        throw new NotFoundError(`Ruangan tidak ditemukan`)
    }

    const existingRuangan = await Ruangan.findOne({
        where: {
            ruangan
        }
    })
    if (existingRuangan && existingRuangan.id !== id) {
        throw new ConflictError(`Ruangan : ${ruangan} sudah ada.`);
    }

    return Ruangan.update({ siakFakultasId, nama, ruangan, kapasitas, lantai }, { where: { id: id } });
};

export const deleteRuangan = async (id) => {
    const cekDataRuangan = await Ruangan.findByPk(id)
    if (!cekDataRuangan) {
        throw new NotFoundError(`Ruangan tidak ditemukan`)
    }

    await cekDataRuangan.destroy()
};

export const getMonitoringRuangan = async ({ hari, unitKerjaId }) => {
    const { fakultasIds, prodiIds } = await resolveUnitKerjaIds(unitKerjaId);

    const ruanganWhere = {
        deletedAt: null,
        [Op.or]: [],
    };

    if (fakultasIds.length > 0) {
        ruanganWhere[Op.or].push({ siakFakultasId: { [Op.in]: fakultasIds } });
    }
    if (prodiIds.length > 0) {
        ruanganWhere[Op.or].push({ siakProgramStudiId: { [Op.in]: prodiIds } });
    }

    if (ruanganWhere[Op.or].length === 0) {
        return buildResponse({ hari, unitKerjaId, ruanganList: [] });
    }

    const ruanganList = await Ruangan.findAll({
        where: ruanganWhere,
        attributes: ["id", "nama", "ruangan", "kapasitas", "lantai"],
        include: [
            {
                model: Fakultas,
                as: "fakultas",
                attributes: ["id", "nama"],
                required: false,
            },
            {
                model: ProgramStudi,
                as: "programStudi",
                attributes: ["id", "nama"],
                required: false,
            },
            {
                model: JadwalKuliah,
                as: "jadwalKuliah",
                required: false,
                where: {
                    hari,
                    deletedAt: null,
                },
                attributes: [
                    "id",
                    "hari",
                    "jamMulai",
                    "jamSelesai",
                    "jenisPetemuan",
                    "metodePembelajaran",
                ],
                include: [
                    {
                        model: KelasKuliah,
                        as: "kelasKuliah",
                        attributes: ["id", "nama", "sistemKuliah", "statusKelas"],
                        include: [
                            {
                                model: MataKuliah,
                                as: "mataKuliah",
                                attributes: ["id", "nama", "kode", "totalSks"],
                            },
                            {
                                model: ProgramStudi,
                                as: "programStudi",
                                attributes: ["id", "nama"],
                            },
                        ],
                    },
                    {
                        model: Dosen,
                        as: "dosen",
                        attributes: ["id", "nama", "nidn"],
                        required: false,
                    },
                ],
            },
        ],
        order: [
            ["lantai", "ASC"],
            ["ruangan", "ASC"],
            [{ model: JadwalKuliah, as: "jadwalKuliah" }, "jamMulai", "ASC"],
        ],
    });

    return buildResponse({ hari, unitKerjaId, ruanganList });
};

const buildResponse = ({ hari, unitKerjaId, ruanganList }) => {
    const result = ruanganList.map((ruangan) => {
        const r = ruangan.toJSON();
        return {
            id: r.id,
            kode: r.ruangan,
            nama: r.nama,
            kapasitas: r.kapasitas,
            lantai: r.lantai,
            pemilik: r.fakultas
                ? { jenis: "fakultas", id: r.fakultas.id, nama: r.fakultas.nama }
                : r.programStudi
                    ? { jenis: "prodi", id: r.programStudi.id, nama: r.programStudi.nama }
                    : null,
            jadwal: r.jadwalKuliah.map((j) => ({
                id: j.id,
                jamMulai: j.jamMulai,
                jamSelesai: j.jamSelesai,
                jenisPetemuan: j.jenisPetemuan,
                metodePembelajaran: j.metodePembelajaran,
                kelas: {
                    id: j.kelasKuliah.id,
                    nama: j.kelasKuliah.nama,
                    sistemKuliah: j.kelasKuliah.sistemKuliah,
                    mataKuliah: {
                        id: j.kelasKuliah.mataKuliah.id,
                        nama: j.kelasKuliah.mataKuliah.nama,
                        kode: j.kelasKuliah.mataKuliah.kode,
                        totalSks: j.kelasKuliah.mataKuliah.totalSks,
                    },
                    programStudi: {
                        id: j.kelasKuliah.programStudi.id,
                        nama: j.kelasKuliah.programStudi.nama,
                    },
                },
                dosen: j.dosen
                    ? { id: j.dosen.id, nama: j.dosen.nama, nidn: j.dosen.nidn }
                    : null,
            })),
        };
    });

    return {
        hari,
        unitKerjaId,
        ruangan: result,
        meta: {
            totalRuangan: result.length,
            ruanganTerpakai: result.filter((r) => r.jadwal.length > 0).length,
            ruanganKosong: result.filter((r) => r.jadwal.length === 0).length,
        },
    };
};