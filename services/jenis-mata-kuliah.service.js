import models from '../models/index.js';
import {getPagination} from "../utils/pagination.js";

const {
    sequelize,
    JenisMataKuliah
} = models;

export const findAll = async (page, size) => {
    try {
        if (page !== null && size !== null) {
            const { limit, offset } = getPagination(page, size);

            const { count, rows } = await JenisMataKuliah.findAndCountAll({
                attributes: ["id", "kode", "nama"],
                limit,
                offset,
                order: [["id", "DESC"]],
                raw: true,
            });

            return {
                count,
                rows,
                isPaginated: true,
            };
        } else {
            const { count, rows } = await JenisMataKuliah.findAndCountAll({
                attributes: ["id", "kode", "nama"],
                // raw: true,
            });

            return {
                count: count,
                rows,
                isPaginated: false,
            };
        }
    } catch (error) {
        throw new Error(error.message);
    }
}

export const createJenisMataKuliah = async (data) => {
    try {
        sequelize.transaction(async (trx) => {
            const existingJenisMk = await JenisMataKuliah.findOne({
                where : {
                    nama: data.nama,
                },
                transaction: trx
            })
            if (existingJenisMk) {
                throw new Error(`Jenis Mata Kuliah dengan nama ${data.nama} sudah ada`);
            }

            await JenisMataKuliah.create({
                kode: data.kode,
                nama: data.nama,
            }, {
                transaction: trx
            })
        })

        return true
    }
    catch (error) {
        throw new Error(error.message);
    }
}

export const updateJenisMataKuliah = async (id, data) => {
    try {
        const updatedData = sequelize.transaction(async (trx) => {
            const JenisMk = await JenisMataKuliah.findByPk(id, {
                transaction: trx
            })
            if (!JenisMk) {
                return null
            }

            const [updatedRowsCount] = await JenisMataKuliah.update(data, {
                where: { id: id },
                transaction: trx
            })

            return updatedRowsCount
        })

        return updatedData > 0
    }
    catch (error) {
        throw new Error(error.message);
    }
}

export const deleteJenisMataKuliah = async (id) => {
    try {
        const deletedData = sequelize.transaction(async (trx) => {
            return await JenisMataKuliah.destroy({
                where: {id: id},
                transaction: trx
            })
        })

        return deletedData > 0;
    }
    catch (error) {
        throw new Error(error.message);
    }
}