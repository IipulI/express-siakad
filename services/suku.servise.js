import models from "../models/index.js"
import { Op } from "sequelize"
import { getPagination } from "../utils/pagination.js";
import { ConflictError, NotFoundError } from "../utils/custom-error.js";

const { Suku } = models;

export const findAll = async (page, size) => {
    const isPaginated = page !== null && size !== null;

    const queryBuilder = {
        attributes: ['id', 'nama'],
        order: [['id', 'DESC']]
    }

    if (isPaginated) {
        const { limit, offset } = getPagination(page, size);
        queryBuilder.limit = limit;
        queryBuilder.offset = offset;

        const { count, rows } = await Suku.findAndCountAll(queryBuilder);

        return {
            count,
            rows,
            isPaginated: true,
        }
    }
    else {
        const data = await Suku.findAll(queryBuilder);

        return {
            count: data.length,
            rows: data,
            isPaginated: false,
        }
    }
};

export const createSuku = async (sukuData) => {
    const { nama } = sukuData;

    const cekDataSuku = await Suku.findOne({
        attributes: ['nama'],
        where: {
            nama: { [Op.iLike]: nama }
        }
    });
    if (cekDataSuku) {
        throw new ConflictError(`Suku : ${nama} sudah ada.`);
    }

    return await Suku.create({ nama });
};

export const updateSuku = async (id, sukuData) => {
    const { nama } = sukuData;

    const cekDataSuku = await Suku.findByPk(id)
    if (!cekDataSuku) {
        throw new NotFoundError(`Suku tidak ditemukan`)
    }

    const existingNameSuku = await Suku.findOne({
        where: {
            nama: { [Op.iLike]: nama }
        }
    })
    if (existingNameSuku && existingNameSuku.id !== id) {
        throw new ConflictError(`Suku : ${nama} sudah ada.`);
    }

    return cekDataSuku.update({ nama })
}

export const deleteSuku = async (id) => {
    const cekDataSuku = await Suku.findByPk(id)

    if (!cekDataSuku) {
        throw new NotFoundError(`Suku tidak ditemukan`)
    }

    await cekDataSuku.destroy()
}
