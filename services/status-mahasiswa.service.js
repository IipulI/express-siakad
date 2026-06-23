import models from '../models/index.js';
import { Op } from "sequelize";
import {getPagination} from "../utils/pagination.js";
import { ConflictError, NotFoundError } from "../utils/custom-error.js";

const { StatusMahasiswa } = models;

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

        const { count, rows } = await StatusMahasiswa.findAndCountAll(queryBuilder);

        return {
            count,
            rows,
            isPaginated: true,
        }
    }
    else {
        const data = await StatusMahasiswa.findAll(queryBuilder);

        return {
            count: data.length,
            rows: data,
            isPaginated: false,
        }
    }
}

export const findOneById = async (id) => {
    const cekDataStatusMahasiswa = await StatusMahasiswa.findByPk(id, {
        attributes: {
            exclude: ['createdAt', 'updatedAt', 'deletedAt']
        }
    })
    if (!cekDataStatusMahasiswa) {
        throw new NotFoundError(`Status Mahasiswa tidak dapat ditemukan`)
    }

    return cekDataStatusMahasiswa;
}

export const createStatusMahasiswa = async (data) => {
    const { kode } = data;

    const cekStatusMahassiwa = await StatusMahasiswa.findOne({
        where: {
            kode: { [Op.iLike] : kode }
        }
    })
    if (cekStatusMahassiwa) {
        throw new ConflictError(`Status Mahasiswa : ${kode} sudah ada.`);
    }

    return await StatusMahasiswa.create(data);
}

export const updateStatusMahasiswa = async (id, data) => {
    const { kode } = data;

    const cekDataStatusMahasiswa = await StatusMahasiswa.findByPk(id)
    if (!cekDataStatusMahasiswa) {
        throw new NotFoundError(`Status Mahasiswa tidak dapat ditemukan`)
    }

    const existingStatusMahasiswa = await StatusMahasiswa.findOne({
        where: {
            kode: { [Op.iLike] : kode }
        }
    })
    if (existingStatusMahasiswa && existingStatusMahasiswa.id !== id) {
        throw new ConflictError(`Status Mahasiswa : ${kode} sudah ada.`);
    }

    return cekDataStatusMahasiswa.update(data)
}

export const deleteStatusMahasiswa = async(id) => {
    const cekDataStatusMahasiswa = await StatusMahasiswa.findByPk(id)
    if (!cekDataStatusMahasiswa) {
        throw new NotFoundError(`Status Mahasiswa tidak dapat ditemukan`)
    }

    await cekDataStatusMahasiswa.destroy()
}