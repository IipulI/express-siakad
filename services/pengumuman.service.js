import models from "../models/index.js";
import { getPagination } from "../utils/pagination.js";
import { Op } from "sequelize";
import { NotFoundError } from "../utils/custom-error.js";

const {
    Pegawai,
    Pengumuman
} = models;

export const findAll = async (page, size, order, limitPage, search) => {
    const isPaginated = page !== null && size !== null
    const queryBuilder = {
        attributes: {
            exclude: ['createdAt', 'updatedAt', 'deletedAt']
        },
    }

    if (order === null || order === undefined) {
        queryBuilder.order = [['id', 'DESC']]
    } else {
        queryBuilder.order = [[order, 'DESC']]
    }

    if (search) {
        queryBuilder.where = {
            judul: { [Op.iLike]: `%${search}%` }
        }
    }

    if (isPaginated) {
        const { limit, offset } = getPagination(page, size);
        queryBuilder.limit = limit;
        queryBuilder.offset = offset;

        const { count, rows } = await Pengumuman.findAndCountAll(queryBuilder);

        return {
            count,
            rows,
            isPaginated: true,
        }
    } else {
        if (limitPage) {
            queryBuilder.limit = limitPage
        }

        const data = await Pengumuman.findAll(queryBuilder);

        return {
            count: data.length,
            rows: data,
            isPaginated: false,
        }
    }
}

export const findOneById = async (id) => {
    const existPengumuman = await Pengumuman.findByPk(id)
    if (!existPengumuman) {
        throw new NotFoundError(`Pengumuman tidak dapat ditemukan`)
    }

    return existPengumuman
}

export const createPengumuman = async (data, file, userId) => {
    const pegawai = await Pegawai.findOne({
        where: {
            siakUserId: userId
        }
    })
    if (!pegawai) {
        throw new NotFoundError(`Pegawai tidak ditemukan`)
    }

    const relativePath = file.path.replace(/\\/g, '/');
    const fileUrl = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;

    const isActive = data.isActive === 'true' || data.isActive === true;
    const isPriority = data.isPriority === 'true' || data.isPriority === true;

    const dataBody = {
        banner: fileUrl,
        siakPegawaiId: pegawai.id,
        judul: data.judul,
        isi: data.isi,
        isActive: isActive,
        isPriority: isPriority,
    }

    return await Pengumuman.create(dataBody);
}

export const updatePengumuman = async (id, data) => {
    const existPengumuman = await findOneById(id);
    if (!existPengumuman) {
        throw new NotFoundError(`Pengumuman tidak dapat ditemukan`)
    }

    return await existPengumuman.update(data);
}

export const deletePengumuman = async (id) => {
    const existPengumuman = await findOneById(id);
    if (!existPengumuman) {
        throw new NotFoundError(`Pengumuman tidak dapat ditemukan`)
    }

    return await existPengumuman.destroy();
}
