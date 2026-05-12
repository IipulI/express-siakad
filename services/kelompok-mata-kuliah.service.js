import models from '../models/index.js';
import {getPagination} from "../utils/pagination.js";
import { ConflictError, NotFoundError } from "../utils/custom-error.js";
import { Op } from "sequelize";

const {
    KelompokMataKuliah
} = models;

export const findAll = async (page, size, search, order) => {
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

        const { count, rows } = await KelompokMataKuliah.findAndCountAll(queryBuilder);

        return {
            count,
            rows,
            isPaginated: true,
        }
    } else {
        const data = await KelompokMataKuliah.findAll(queryBuilder);

        return {
            count: data.length,
            rows: data,
            isPaginated: false,
        }
    }
}

export const findOneById = async (id) => {
    const existDataKelompokMataKuliah = await KelompokMataKuliah.findOne(id);
    if (!existDataKelompokMataKuliah) {
        throw new NotFoundError(`Kelompok Mata Kuliah tidak dapat ditemukan`)
    }

    return existDataKelompokMataKuliah;
}

export const createKelompokMataKuliah = async (data) => {
    const existingDataKelompokMataKuliah = await KelompokMataKuliah.findOne({
        where: {
            [Op.or] : [
                { nama: data.nama },
                { kode: data.kode }
            ]
        }
    })
    if (existingDataKelompokMataKuliah) {
        throw new ConflictError(`Kelompok Mata Kuliah dengan nama ${data.nama} atau kode ${data.kode} sudah ada`);
    }

    return await KelompokMataKuliah.create(data);
}

export const updateKelompokMataKuliah = async (id, data) => {
    const existDataKelompokMataKuliah = await KelompokMataKuliah.findByPk(id)
    if (!existDataKelompokMataKuliah) {
        throw new NotFoundError(`Kelompok Mata Kuliah tidak dapat ditemukan`)
    }

    const existingDataKelompokMataKuliah = await KelompokMataKuliah.findOne({
        where: {
            [Op.or] : [
                { nama: data.nama },
                { kode: data.kode }
            ]
        }
    })
    if (existingDataKelompokMataKuliah && existingDataKelompokMataKuliah.id !== id) {
        throw new ConflictError(`Kelompok Mata Kuliah dengan nama ${data.nama} atau kode ${data.kode} sudah ada`);
    }

    return existDataKelompokMataKuliah.update(data)
}

export const deleteKelompokMataKuliah = async(id) => {
    const existDataKelompokMataKuliah = await KelompokMataKuliah
    if (!existDataKelompokMataKuliah) {
        throw new NotFoundError(`Kelompok Mata Kuliah tidak dapat ditemukan`)
    }

    await existDataKelompokMataKuliah.destroy()
}