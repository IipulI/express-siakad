import models from "../models/index.js";
import { getPagination, getPagingData } from "../utils/pagination.js";
import { BadRequestError, ConflictError, NotFoundError } from "../utils/custom-error.js";
import { Op } from "sequelize";

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

const HARI_MAP = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

const getHariFromTanggal = (tanggal) => {
    const [year, month, day] = tanggal.split("-").map(Number);
    const dayIndex = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
    return HARI_MAP[dayIndex];
};

export const getMonitoringRuangan = async ({
    tanggal,
    fakultasId,
    programStudiId,
    dosenId,
    kapasitasMin,
    search,
    page,
    size,
}) => {
    if (!tanggal) {
        throw new BadRequestError("Parameter tanggal wajib diisi");
    }

    const hari = getHariFromTanggal(tanggal);

    const ruanganWhere = {};
    if (fakultasId) {
        ruanganWhere.siakFakultasId = fakultasId;
    }
    if (programStudiId) {
        ruanganWhere.siakProgramStudiId = programStudiId;
    }
    if (kapasitasMin) {
        ruanganWhere.kapasitas = { [Op.gte]: Number(kapasitasMin) };
    }
    if (search) {
        ruanganWhere[Op.or] = [
            { ruangan: { [Op.iLike]: `%${search}%` } },
            { nama: { [Op.iLike]: `%${search}%` } },
        ];
    }

    const totalRuangan = await Ruangan.count({ where: ruanganWhere });

    const { limit, offset } = getPagination(page, size);

    // Ambil halaman ruangan lebih dulu (tanpa join ke jadwal) supaya paginasi
    // tidak terpengaruh oleh jumlah baris jadwal per ruangan.
    const ruanganPage = await Ruangan.findAll({
        where: ruanganWhere,
        attributes: ["id", "nama", "ruangan", "kapasitas", "lantai"],
        limit,
        offset,
        order: [
            ["lantai", "ASC"],
            ["ruangan", "ASC"],
        ],
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
        ],
    });

    const ruanganIds = ruanganPage.map((r) => r.id);

    // Ambil jadwal perkuliahan untuk ruangan-ruangan pada halaman ini secara terpisah,
    // supaya filter dosen/tanggal tidak ikut memangkas jumlah ruangan yang tampil.
    let jadwalByRuanganId = {};
    if (ruanganIds.length > 0) {
        const jadwalWhere = { hari, siakRuanganId: { [Op.in]: ruanganIds } };
        if (dosenId) {
            jadwalWhere.siakDosenId = dosenId;
        }

        const jadwalList = await JadwalKuliah.findAll({
            where: jadwalWhere,
            attributes: [
                "id",
                "siakRuanganId",
                "jamMulai",
                "jamSelesai",
                "jenisPertemuan",
                "metodePembelajaran",
            ],
            include: [
                {
                    model: KelasKuliah,
                    as: "kelasKuliah",
                    required: true,
                    where: {
                        [Op.and]: [
                            {
                                [Op.or]: [
                                    { tanggalMulai: null },
                                    { tanggalMulai: { [Op.lte]: tanggal } },
                                ],
                            },
                            {
                                [Op.or]: [
                                    { tanggalSelesai: null },
                                    { tanggalSelesai: { [Op.gte]: tanggal } },
                                ],
                            },
                        ],
                    },
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
            order: [["jamMulai", "ASC"]],
        });

        jadwalByRuanganId = jadwalList.reduce((acc, jadwal) => {
            const j = jadwal.toJSON();
            (acc[j.siakRuanganId] ||= []).push(j);
            return acc;
        }, {});
    }

    return buildMonitoringResponse({
        tanggal,
        hari,
        ruanganPage,
        jadwalByRuanganId,
        totalRuangan,
        page,
        size,
    });
};

const buildMonitoringResponse = ({
    tanggal,
    hari,
    ruanganPage,
    jadwalByRuanganId,
    totalRuangan,
    page,
    size,
}) => {
    const result = ruanganPage.map((ruangan) => {
        const r = ruangan.toJSON();
        const jadwalList = jadwalByRuanganId[r.id] || [];

        return {
            id: r.id,
            kode: r.ruangan,
            nama: r.nama,
            kapasitas: r.kapasitas,
            lantai: r.lantai,
            fakultas: r.fakultas ? { id: r.fakultas.id, nama: r.fakultas.nama } : null,
            programStudi: r.programStudi ? { id: r.programStudi.id, nama: r.programStudi.nama } : null,
            status: jadwalList.length > 0 ? "terpakai" : "kosong",
            jadwal: jadwalList.map((j) => ({
                id: j.id,
                jenisKegiatan: "perkuliahan",
                jamMulai: j.jamMulai,
                jamSelesai: j.jamSelesai,
                jenisPertemuan: j.jenisPertemuan,
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

    const pagingData = getPagingData({ count: totalRuangan, rows: result }, page, size);

    return {
        tanggal,
        hari,
        ruangan: pagingData.items,
        meta: {
            total: pagingData.total,
            perPage: pagingData.perPage,
            currentPage: pagingData.currentPage,
            totalPage: pagingData.totalPage,
            ruanganTerpakai: result.filter((r) => r.status === "terpakai").length,
            ruanganKosong: result.filter((r) => r.status === "kosong").length,
        },
    };
};