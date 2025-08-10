import { getPagination } from "../utils/pagination.js";
import * as models from "../models/index.js"
const { sequelize, MataKuliah } = models;

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
                const prasyaratMataKuliah1 = await MataKuliah.findByPk(mataKuliahData.prasyaratMataKuliah1Id, {
                    transaction: t,
                    lock: t.LOCK
                });
                if (!prasyaratMataKuliah1) {
                    throw new Error(`Prasyarat Mata Kuliah 1 tidak ditemukan`)
                }
            }
            if (mataKuliahData.prasyaratMataKuliah2Id != null) {
                const prasyaratMataKuliah2 = await MataKuliah.findByPk(mataKuliahData.prasyaratMataKuliah2Id, {
                    transaction: t,
                    lock: t.LOCK
                });
                if (!prasyaratMataKuliah2) {
                    throw new Error(`Prasyarat Mata Kuliah 2 tidak ditemukan`)
                }
            }
            if (mataKuliahData.prasyaratMataKuliah3Id != null) {
                const prasyaratMataKuliah3 = await MataKuliah.findByPk(mataKuliahData.prasyaratMataKuliah3Id, {
                    transaction: t,
                    lock: t.LOCK
                });
                if (!prasyaratMataKuliah3) {
                    throw new Error(`Prasyarat Mata Kuliah 3 tidak ditemukan`)
                }
            }

            const createdMataKuliah = await MataKuliah.create(
                {
                    siakProgramStudiId: mataKuliahData.siakProgramStudiId,
                    siakTahunKurikulumId: mataKuliahData.siakTahunKurikulumId,
                    nama: mataKuliahData.nama,
                    kode: mataKuliahData.kode,
                    jenis: mataKuliahData.jenis,
                    adaPraktikum: mataKuliahData.adaPraktikum,
                    sksTatapMuka: mataKuliahData.sksTatapMuka,
                    sksPraktikum: mataKuliahData.sksPraktikum,
                    sksPraktikLapangan: mataKuliahData.sksPraktikLapangan,
                    totalSks: mataKuliahData.sksTatapMuka + mataKuliahData.sksPraktikum + mataKuliahData.sksPraktikLapangan,

                    prasyaratMataKuliah1: mataKuliahData.prasyaratMataKuliah1Id,
                    prasyaratMataKuliah2: mataKuliahData.prasyaratMataKuliah2Id,
                    prasyaratMataKuliah3: mataKuliahData.prasyaratMataKuliah3Id
                },
                {
                    transaction: t,
                }
            )

            // return if success
            return createdMataKuliah
        })

        return true;
    }
    catch (error) {
        throw new Error(`Error creating data : ${error.message}`);
    }
}

export const updateMataKuliah = async (id, mataKuliahData) => {
    try {
        const existMataKuliah = await MataKuliah.findByPk(id);
        if (!existMataKuliah) {
            throw new Error(`Mata Kuliah does not exist`);
        }

        if (mataKuliahData.prasyaratMataKuliah1Id != null) {
            const prasyaratMataKuliah1 = await MataKuliah.findByPk(mataKuliahData.prasyaratMataKuliah1Id, {
                transaction: t,
                lock: t.LOCK
            });
            if (!prasyaratMataKuliah1) {
                throw new Error(`Prasyarat Mata Kuliah 1 tidak ditemukan`)
            }
        }
        if (mataKuliahData.prasyaratMataKuliah2Id != null) {
            const prasyaratMataKuliah2 = await MataKuliah.findByPk(mataKuliahData.prasyaratMataKuliah2Id, {
                transaction: t,
                lock: t.LOCK
            });
            if (!prasyaratMataKuliah2) {
                throw new Error(`Prasyarat Mata Kuliah 2 tidak ditemukan`)
            }
        }
        if (mataKuliahData.prasyaratMataKuliah3Id != null) {
            const prasyaratMataKuliah3 = await MataKuliah.findByPk(mataKuliahData.prasyaratMataKuliah3Id, {
                transaction: t,
                lock: t.LOCK
            });
            if (!prasyaratMataKuliah3) {
                throw new Error(`Prasyarat Mata Kuliah 3 tidak ditemukan`)
            }
        }

        const [updatedRowsCount] = await MataKuliah.update({
            nama: mataKuliahData.nama,
            kode: mataKuliahData.kode,
            jenis: mataKuliahData.jenis,
            adaPraktikum: mataKuliahData.adaPraktikum,
            sksTatapMuka: mataKuliahData.sksTatapMuka,
            sksPraktikum: mataKuliahData.sksPraktikum,
            sksPraktikLapangan: mataKuliahData.sksPraktikLapangan,
            totalSks: mataKuliahData.sksTatapMuka + mataKuliahData.sksPraktikum + mataKuliahData.sksPraktikLapangan,

            prasyaratMataKuliah1: mataKuliahData.prasyaratMataKuliah1Id,
            prasyaratMataKuliah2: mataKuliahData.prasyaratMataKuliah2Id,
            prasyaratMataKuliah3: mataKuliahData.prasyaratMataKuliah3Id
        }, {
            where: {
                id: id
            }
        })

        return updatedRowsCount > 0;
    }
    catch (error) {
        throw new Error(`Error updating data : ${error.message}`);
    }
}

export const deleteMataKuliah = async (id) => {
    try {
        const deletedRowsCount = await MataKuliah.destroy({
            where: { id: id }
        })

        return deletedRowsCount > 0;
    }
    catch (error) {
        throw new Error(`Error deleting Mata Kuliah : ${error.message}`);
    }
}