import models from '../models/index.js';
import {getPagination} from "../utils/pagination.js";
import { ConflictError, NotFoundError } from "../utils/custom-error.js";
import { Op } from "sequelize";

const {
    JenisMataKuliah
} = models;

export const findAll = async (page, size, search) => {
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

        const { count, rows } = await JenisMataKuliah.findAndCountAll(queryBuilder);

        return {
            count,
            rows,
            isPaginated: true,
        }
    } else {
        const data = await JenisMataKuliah.findAll(queryBuilder);

        return {
            count: data.length,
            rows: data,
            isPaginated: false,
        }
    }
}

export const findOneById = async (id) => {
    const existDataMataKuliah = await JenisMataKuliah.findOne(id);
    if (!existDataMataKuliah) {
        throw new NotFoundError(`Jenis Mata Kuliah tidak dapat ditemukan`)
    }

    return existDataMataKuliah;
}

export const createJenisMataKuliah = async (data) => {
    const existingDataJenisMataKuliah = await JenisMataKuliah.findOne({
        where : {
            [Op.or] : [
                { nama: data.nama },
                { kode: data.kode }
            ]
        }
    })
    if (existingDataJenisMataKuliah) {
        throw new ConflictError(`Jenis Mata Kuliah dengan nama ${data.nama} atau kode ${data.kode} sudah ada`);
    }

    return await JenisMataKuliah.create(data);
}

export const updateJenisMataKuliah = async (id, data) => {
    const existDataJenisMataKuliah = await JenisMataKuliah.findByPk(id)
    if (!existDataJenisMataKuliah) {
        throw new NotFoundError(`Jenis Mata Kuliah tidak dapat ditemukan`)
    }

    const existingDataJenisMataKuliah = await JenisMataKuliah.findOne({
        where : {
            [Op.or] : [
                { nama: data.nama },
                { kode: data.kode }
            ]
        }
    })
    if (existingDataJenisMataKuliah && existingDataJenisMataKuliah.id !== id) {
        throw new ConflictError(`Jenis Mata Kuliah dengan nama ${data.nama} atau kode ${data.kode} sudah ada`);
    }

    return existDataJenisMataKuliah.update(data)
}

export const deleteJenisMataKuliah = async(id) => {
    const existDataJenisMataKuliah = await JenisMataKuliah.findByPk(id)
    if (!existDataJenisMataKuliah) {
        throw new NotFoundError(`Jenis Mata Kuliah tidak dapat ditemukan`)
    }

    await existDataJenisMataKuliah.destroy()
}