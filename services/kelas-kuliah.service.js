import {getPagination} from "../utils/pagination.js";
import models from "../models/index.js"

const { KelasKuliah, MataKuliah, PeriodeAkademik, JadwalKuliah, Dosen, Ruangan, Mahasiswa, KrsMahasiswa, RincianKrsMahasiswa } = models;

export const findAll = async (page,size) => {
    try {
        const { limit, offset } = getPagination(page, size);

        const { count, rows } = await KelasKuliah.findAndCountAll({
            attributes: [
                'id', 'siakMataKuliahId', 'siakPeriodeAkademikId',
                'nama', 'kapasitas', 'jumlah_peminat', 'sistem_kuliah', 'status_kelas'
            ],
            limit,
            offset,
            include: [
                {
                    attributes: [
                        'id', 'nama', 'kode', 'totalSks'
                    ],
                    model: MataKuliah,
                    as: 'mataKuliah',
                },
                {
                    attributes: [
                        'id', 'nama',
                    ],
                    model: PeriodeAkademik,
                    as: 'periodeAkademik'
                },
                {
                    attributes: [
                        'id', 'hari', 'jamMulai', 'jamSelesai', 'jenisPertemuan', 'metodePembelajaran'
                    ],
                    model: JadwalKuliah,
                    as: 'jadwalKuliah',
                    separate: true,
                    include: [
                        {
                            attributes: [
                                'id', 'nama', 'nidn'
                            ],
                            model: Dosen,
                            as: 'dosen'
                        },
                        {
                            attributes: [
                                'id', 'nama', 'ruangan'
                            ],
                            model: Ruangan,
                            as: 'ruangan'
                        }
                    ]
                }
            ]
        })

        return {
            count,
            rows,
            isPaginated: true
        }
    }
    catch (error) {
        console.log(error)

        throw new Error(`Error retrieving data : ${error}`);
    }
}

export const detailClass = async (id) => {
    try {
        const dataClass = await KelasKuliah.findByPk(id, {
            attributes: {
                exclude: ['createdAt', 'updatedAt', 'deletedAt']
            },
            include: [
                {
                    attributes: [
                        'id', 'nama', 'kode', 'totalSks'
                    ],
                    model: MataKuliah,
                    as: 'mataKuliah',
                },
                {
                    attributes: [
                        'id', 'nama',
                    ],
                    model: PeriodeAkademik,
                    as: 'periodeAkademik'
                },
                {
                    attributes: [
                        'id', 'hari', 'jamMulai', 'jamSelesai', 'jenisPertemuan', 'metodePembelajaran'
                    ],
                    model: JadwalKuliah,
                    as: 'jadwalKuliah',
                    separate: true
                }
            ]
        })
        if (!dataClass) {
            throw new Error(`KelasKuliah doesn't exist`)
        }

        return dataClass
    }
    catch (error) {
        console.log(error)
        throw new Error(error);
    }
}

export const classSchedule = async(id) => {
    try {
        const existClass = await KelasKuliah.findByPk(id)
        if (!existClass) {
            throw new Error(`KelasKuliah doesn't exist`)
        }

        return await JadwalKuliah.findAll({
            attributes: {
                exclude: ['createdAt', 'updatedAt', 'deletedAt', 'siak_dosen_id', 'siak_kelas_kuliah_id', 'siak_ruangan_id']
            },
            where: {
                siakKelasKuliahId: id
            },
            include: [
                {
                    attributes: [
                        'id', 'nama', 'nidn'
                    ],
                    model: Dosen,
                    as: 'dosen'
                },
                {
                    attributes: [
                        'id', 'nama', 'ruangan'
                    ],
                    model: Ruangan,
                    as: 'ruangan'
                }
            ]
        });
    }
    catch (error) {
        console.log(error)
        throw new Error(error);
    }
}

export const classParticipant = async(id) => {
    try {
        const existClass = await KelasKuliah.findByPk(id, {attributes: ['id']})
        if (!existClass) {
            throw new Error(`KelasKuliah doesn't exist`)
        }

        return await Mahasiswa.findAll({
            attributes: ['id', 'nama', 'npm'],
            include : {
                attributes: ['status'],
                required: true,
                model: KrsMahasiswa,
                as: 'krsMahasiswa',
                include: {
                    attributes: [],
                    required: true,
                    model: RincianKrsMahasiswa,
                    as: 'rincianKrsMahasiswa',
                    where: {
                        siak_kelas_kuliah_id: id
                    }
                }
            }
        })
    }
    catch (error) {
        console.log(error)
        throw new Error(error);
    }
}