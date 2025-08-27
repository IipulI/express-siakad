import * as models from "../models/index.js";
const { MataKuliah } = models

export const fetchKurikulumProdi = async (programStudiId, tahunKurikulumId) => {
    try {
        if (programStudiId === null && tahunKurikulumId === null) {
            throw new Error(`Program studi dan tahun kurikulum wajib diisi`)
        }

        const rows = await MataKuliah.findAll({
            where: {
                siakProgramStudiId: programStudiId,
                siakTahunKurikulumId: tahunKurikulumId
            },
            order: [
                ['semester', 'ASC'],
                ['jenis', 'ASC'],
                ['nama', 'ASC']
            ]
        })

        return rows
    }
    catch (error) {
        throw new Error(`Terjadi kesalahan saat mengambil data: ${error.message}`)
    }
}

export const addCourseToKurikulumProdi = async (id, courseData) => {
    try {
        const existingMataKuliah = MataKuliah.findByPk(id)
        if (!existingMataKuliah) {
            throw new Error(`Data MataKuliah tidak ditemukan`)
        }

        const [updatedRowsCount] = await MataKuliah.update({
            nilaiMin: courseData.nilaiMin,
            semester: courseData.semester,
            opsiWajib: courseData.opsiWajib,
        }, {
            where: {
                id: id
            }
        })

        return updatedRowsCount > 0;
    }
    catch (error) {
        throw new Error(`Terjadi kesalahan saat memperbarui data: ${error.message}`)
    }
}

export const deleteCourseFromKurikulumProdi = async (id) => {
    try {
        const existingMataKuliah = MataKuliah.findByPk(id)
        if (!existingMataKuliah) {
            throw new Error(`Data Mata Kuliah tidak ditemukan`)
        }

        const [updatedRowsCount] = await MataKuliah.update({
            nilaiMin: null,
            semester: null,
            opsiWajib: null
        }, {
            where: {
                id: id
            }
        })
    }
    catch (error) {
        throw new Error(`Terjadi kesalahan saat memperbarui data: ${error.message}`)
    }
}