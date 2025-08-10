import { getPagination } from "../utils/pagination.js";
import models from "../models/index.js"
const { KelasKuliah, MataKuliah, PeriodeAkademik, JadwalKuliah, Dosen, Ruangan } = models;

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