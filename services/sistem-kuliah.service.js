import models from "../models/index.js"
import { Op } from "sequelize"
import { getPagination } from "../utils/pagination.js";
import { ConflictError, NotFoundError } from "../utils/custom-error.js";

const { SistemKuliah } = models;

export const findAll = async (page, size) => {
    const isPaginated = page !== null && size !== null;
    const queryBuilder = {
        attributes: {
            exclude: ['createdAt', 'updatedAt', 'deletedAt']
        },
        order: [['id', 'DESC']],
    }

    if (isPaginated) {
        const { limit, offset } = getPagination(page, size);
        queryBuilder.limit = limit;
        queryBuilder.offset = offset;

        const { count, rows } = await SistemKuliah.findAndCountAll(queryBuilder);

        return {
            count,
            rows,
            isPaginated: true,
        }
    } else {
        const data = await SistemKuliah.findAll(queryBuilder);

        return {
            count: data.length,
            rows: data,
            isPaginated: false,
        }
    }
}

export const findOneById = async (id) => {
    const cekDataSistemKuliah = await SistemKuliah.findByPk(id, {
        attributes: {
            exclude: ['createdAt', 'updatedAt', 'deletedAt']
        }
    })
    if (!cekDataSistemKuliah) {
        throw new NotFoundError(`Sistem Kuliah tidak dapat ditemukan`)
    }

    return cekDataSistemKuliah;
}

export const createSistemKuliah = async (data) => {
    const { nama } = data;

    const cekDataSistemKuliah = await SistemKuliah.findOne({
        attributes: ['nama'],
        where: {
            nama: { [Op.iLike] : nama }
        }
    })
    if (cekDataSistemKuliah) {
        throw new ConflictError(`Sistem Kuliah : ${nama} sudah ada.`);
    }

    return await SistemKuliah.create(data);
}

export const updateSistemKuliah = async (id, data) => {
    const { nama } = data;

    const cekDataSistemKuliah = await SistemKuliah.findByPk(id)
    if (!cekDataSistemKuliah) {
        throw new NotFoundError(`Sistem Kuliah tidak dapat ditemukan`)
    }

    const existingNameSistemKuliah = await SistemKuliah.findOne({
        where: {
            nama: { [Op.iLike] : nama }
        }
    })
    if (existingNameSistemKuliah && existingNameSistemKuliah.id !== id) {
        throw new ConflictError(`Sistem Kuliah : ${nama} sudah ada.`);
    }

    return cekDataSistemKuliah.update(data)
}

export const deleteSistemKuliah = async (id) => {
    const cekDataSistemKuliah = await SistemKuliah.findByPk(id)
    if (!cekDataSistemKuliah) {
        throw new NotFoundError(`Sistem Kuliah tidak dapat ditemukan`)
    }

    await cekDataSistemKuliah.destroy()
}
