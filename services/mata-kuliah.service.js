import {getPagination} from "../utils/pagination.js";
import MataKuliah from "../models/mata-kuliah.models.js";
import {sequelize} from "../config/database.js";

export const findAll = async (page, size) => {
    try {
        if (page !== null && size !== null) {
            const { limit, offset } = getPagination(page, size);

            const { count, rows } = await MataKuliah.findAndCountAll({
                limit,
                offset,
                order: [['createdAt', 'DESC']],
                raw: true
            })

            return {
                count,
                rows,
                isPaginated: true
            }
        }
        else {
            const { count, rows } = await MataKuliah.findAndCountAll({
                raw:true
            })

            return {
                count,
                rows,
                isPaginated: false
            }
        }
    }
    catch (error) {
        throw new Error(`Error retrieving data : ${error.message}`);
    }
}

export const findOne = async (id) => {
    try {
        const existMataKuliah = MataKuliah.findByPk(id)
        if (!existMataKuliah) {
            throw new Error(`MataKuliah doesn\'t exist`);
        }

        return existMataKuliah;
    }
    catch (error) {
        throw new Error(`Error retrieving data : ${error.message}`);
    }
}

export const createMataKuliah = async (mataKuliahData) => {

    // Untuk pengecekan program studi nanti
    // const programStudiExist = await ProgramStudiModels.findByPk(mataKuliahData.siakProgramStudiId)
    // if (!programStudiExist) {
    //     throw new Error(`Program Studi doesn\'t exist`);
    // }

    try {
        const newMataKuliah = sequelize.transaction(async (t) => {

            if (mataKuliahData.prasyaratMataKuliah1Id != null) {
                const prasyaratMataKuliah1 = await MataKuliah.findByPk(mataKuliahData.prasyaratMataKuliah1Id);
                if (!prasyaratMataKuliah1) {
                    throw new Error(`Prasyarat Mata Kuliah 1 tidak ditemukan`)
                }
            }
            if (mataKuliahData.prasyaratMataKuliah2Id != null) {
                const prasyaratMataKuliah2 = await MataKuliah.findByPk(mataKuliahData.prasyaratMataKuliah2Id);
                if (!prasyaratMataKuliah2) {
                    throw new Error(`Prasyarat Mata Kuliah 2 tidak ditemukan`)
                }
            }
            if (mataKuliahData.prasyaratMataKuliah3Id != null) {
                const prasyaratMataKuliah3 = await MataKuliah.findByPk(mataKuliahData.prasyaratMataKuliah3Id);
                if (!prasyaratMataKuliah3) {
                    throw new Error(`Prasyarat Mata Kuliah 3 tidak ditemukan`)
                }
            }

        })
    }
    catch (error) {
        throw new Error(`Error creating data : ${error.message}`);
    }
}