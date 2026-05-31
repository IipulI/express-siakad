import models from "../models/index.js";
import { getPagination } from "../utils/pagination.js";
import { ConflictError, NotFoundError } from "../utils/custom-error.js";
import { Op } from "sequelize";

const { Jenjang } = models;

export const findAll = async (page, size) => {
    const isPaginated = page !== null && size !== null
    let queryBuilder = {
        attributes: ['id', 'nama', 'jenjang'],
        order: [['id', 'DESC']]
    }

    if (isPaginated) {
        const { limit, offset } = getPagination(page, size);
        queryBuilder.limit = limit;
        queryBuilder.offset = offset;

        const { count, rows } = await Jenjang.findAndCountAll(queryBuilder);

        return {
            count,
            rows,
            isPaginated: true,
        }
    } else {
        const data = await Jenjang.findAll(queryBuilder);

        return {
            count: data.length,
            rows: data,
            isPaginated: false,
        }
    }
}

export const findOneById = async (id) => {
    const dataJenjangExist = await Jenjang.findByPk(id)

    if (!dataJenjangExist) {
        throw new NotFoundError(`Jenjang tidak dapat ditemukan`)
    }

    return dataJenjangExist
}

export const createJenjang = async (jenjangData) => {
    const existingJenjang = await Jenjang.findOne({
        where: {
            jenjang: jenjangData.jenjang
        }
    })

    if (existingJenjang) {
        throw new ConflictError(`Jenjang : ${jenjangData.jenjang} sudah ada.`);
    }

    return await Jenjang.create(jenjangData);
}

export const updateJenjang = async (id, jenjangData) => {
    const existDataJenjang = await Jenjang.findByPk(id)

    if (!existDataJenjang) {
        throw new NotFoundError(`Jenjang tidak dapat ditemukan`)
    }

    const existJenjangNameKode = await Jenjang.findOne({
        where: {
            [Op.or] : [
                { jenjang: jenjangData.jenjang },
                { nama: jenjangData.nama }
            ]
        }
    })
    if (existJenjangNameKode && existJenjangNameKode.id !== id) {
        throw new ConflictError(`Jenjang : ${jenjangData.jenjang} sudah ada.`);
    }

    return existDataJenjang.update(jenjangData)
}

export const deleteJenjang = async (id) => {
    const existDataJenjang = await Jenjang.findByPk(id)

    if (!existDataJenjang) {
        throw new NotFoundError(`Jenjang tidak dapat ditemukan`)
    }

    await existDataJenjang.destroy()
}