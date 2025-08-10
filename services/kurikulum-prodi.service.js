import * as models from "../models/index.js";
const { MataKuliah } = models

export const fetchKurikulumProdi = async (programStudiId, tahunKurikulumId) => {
    try {
        if (programStudiId === null && tahunKurikulumId === null) {
            throw new Error(`Program studi and tahun kurikulum is required`)
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
        throw new Error(`Error retrieving data : ${error.message}`)
    }
}

export const addCourseToKurikulumProdi = async (id, courseData) => {
    try {
        const existingMataKuliah = MataKuliah.findByPk(id)
        if (!existingMataKuliah) {
            throw new Error(`Data MataKuliah doesn't exist`)
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
        throw new Error(`Error updating data : ${error.message}`)
    }
}

export const deleteCourseFromKurikulumProdi = async (id) => {
    try {
        const existingMataKuliah = MataKuliah.findByPk(id)
        if (!existingMataKuliah) {
            throw new Error(`Data MataKuliah doesn't exist`)
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
        throw new Error(`Error updating data : ${error.message}`)
    }
}