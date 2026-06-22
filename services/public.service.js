import db from "../models/index.js"
import { getPagination } from "../utils/pagination.js";

const {
    Dosen,
    Fakultas,
    JadwalKuliah,
    KelasKuliah,
    KrsMahasiswa,
    Mahasiswa,
    MataKuliah,
    ProgramStudi,
    RincianKrsMahasiswa,
    Ruangan,
    TahunKurikulum
} = db

export const fetchAllExport = async (page, size) => {
    const isPaginated = page !== null && size !== null;

    const queryBuilder = {
        attributes: {
            exclude: ["createdAt", "updatedAt", "deletedAt"],
        },
        limit: 10,
        include: [
            {
                attributes: {
                    exclude: ["createdAt", "updatedAt", "deletedAt"],
                },
                model: MataKuliah,
                as: "mataKuliah",
                include: [
                    {
                        attributes: {
                            exclude: ["createdAt", "updatedAt", "deletedAt"],
                        },
                        model: ProgramStudi,
                        as: "programStudi",
                        include: {
                            attributes: {
                                exclude: ["createdAt", "updatedAt", "deletedAt"],
                            },
                            model: Fakultas,
                            as: "fakultas",
                        }
                    },
                    {
                        attributes: {
                            exclude: ["createdAt", "updatedAt", "deletedAt"],
                        },
                        model: TahunKurikulum,
                        as: "tahunKurikulum",
                    },
                    {
                        attributes: {
                            exclude: ["createdAt", "updatedAt", "deletedAt"],
                        },
                        model: MataKuliah,
                        as: 'prasyarat1',
                        required: false
                    },
                    {
                        attributes: {
                            exclude: ["createdAt", "updatedAt", "deletedAt"],
                        },
                        model: MataKuliah,
                        as: 'prasyarat2',
                        required: false
                    },
                    {
                        attributes: {
                            exclude: ["createdAt", "updatedAt", "deletedAt"],
                        },
                        model: MataKuliah,
                        as: 'prasyarat3',
                        required: false
                    }
                ]
            },
            {
                attributes: {
                    exclude: ["createdAt", "updatedAt", "deletedAt"],
                },
                model: JadwalKuliah,
                as: "jadwalKuliah",
                include: [
                    {
                        attributes: {
                            exclude: ["createdAt", "updatedAt", "deletedAt"],
                        },
                        model: Ruangan,
                        as: "ruangan"
                    },
                    {
                        attributes: {
                            exclude: ["createdAt", "updatedAt", "deletedAt"],
                        },
                        model: Dosen,
                        as: "dosen"
                    }
                ]
            },
            {
                attributes: {
                    exclude: ["createdAt", "updatedAt", "deletedAt"],
                },
                model: RincianKrsMahasiswa,
                as: "rincianKrsMahasiswa",
                include: {
                    attributes: {
                        exclude: ["createdAt", "updatedAt", "deletedAt"],
                    },
                    model: KrsMahasiswa,
                    as: "krsMahasiswa",
                    include: {
                        attributes: {
                            exclude: ["createdAt", "updatedAt", "deletedAt"],
                        },
                        model: Mahasiswa,
                        as: "mahasiswa"
                    }
                }
            }
        ]
    }

    if (isPaginated) {
        const { limit, offset } = getPagination(page, size);
        queryBuilder.limit = limit;
        queryBuilder.offset = offset

        const { count, rows } = await KelasKuliah.findAndCountAll(queryBuilder)

        return {
            count,
            rows,
            isPaginated: true
        }
    } else {
        const data = await KelasKuliah.findAll(queryBuilder)

        return {
            count: data.length,
            rows: data,
            isPaginated: false
        }
    }


    return data;
}
