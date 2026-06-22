import db from '../models/index.js'
import { NotFoundError } from "../utils/custom-error.js";

const {
    HasilStudi,
    Mahasiswa,
    PeriodeAkademik,
    Pengumuman,
} = db

export const getDashboardMahasiswa = async (idMahasiswa) => {
    const existMahasiswa = Mahasiswa.findByPk(idMahasiswa)
    if (!existMahasiswa) {
        throw new NotFoundError('Mahasiswa tidak ditemukan')
    }

    const hasilStudi = await HasilStudi.findAll({
        attributes: {
            exclude: ['createdAt', 'updatedAt', 'deletedAt']
        },
        where: {
            siakMahasiswaId: idMahasiswa
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

    const pengumuman = await Pengumuman.findAll({
        attributes: {
            exclude: ['createdAt', 'updatedAt', 'deletedAt']
        },
        where : {
            isActive : true
        },
        order: [['createdAt', 'DESC']],
        limit: 3,
    })

    return {
        hasilStudi: hasilStudi,
        pengumuman: pengumuman,
    }
}