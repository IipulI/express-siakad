import models from "../models/index.js";
import { Op } from "sequelize";
import { getPagination } from "../utils/pagination.js";
import { ConflictError, NotFoundError } from "../utils/custom-error.js";

const { JenisPertemuan } = models;

export const findAll = async (page, size) => {
    const isPaginated = page !== null && size !== null;

    const queryBuilder = {
        attributes: ['id', 'nama'],
        order: [['id', 'DESC']],
    };

    if (isPaginated) {
        const { limit, offset } = getPagination(page, size);
        queryBuilder.limit = limit;
        queryBuilder.offset = offset;

        const { count, rows } = await JenisPertemuan.findAndCountAll(queryBuilder);

        return {
            count,
            rows,
            isPaginated: true,
        };
    } else {
        const data = await JenisPertemuan.findAll(queryBuilder);

        return {
            count: data.length,
            rows: data,
            isPaginated: false,
        };
    }
};

export const findOneById = async (id) => {
    const jenisPertemuan = await JenisPertemuan.findByPk(id, {
        attributes: ['id', 'nama'],
    });

    if (!jenisPertemuan) {
        throw new NotFoundError(`Jenis Pertemuan tidak ditemukan`);
    }

    return jenisPertemuan;
};

export const createJenisPertemuan = async (payload) => {
    const { nama } = payload;

    const existing = await JenisPertemuan.findOne({
        attributes: ['id'],
        where: { nama: { [Op.iLike]: nama } },
    });
    if (existing) {
        throw new ConflictError(`Jenis Pertemuan : ${nama} sudah ada.`);
    }

    return await JenisPertemuan.create({ nama });
};

export const updateJenisPertemuan = async (id, payload) => {
    const { nama } = payload;

    const jenisPertemuan = await JenisPertemuan.findByPk(id);
    if (!jenisPertemuan) {
        throw new NotFoundError(`Jenis Pertemuan tidak ditemukan`);
    }

    const existing = await JenisPertemuan.findOne({
        where: { nama: { [Op.iLike]: nama } },
    });
    if (existing && existing.id !== id) {
        throw new ConflictError(`Jenis Pertemuan : ${nama} sudah ada.`);
    }

    return jenisPertemuan.update({ nama });
};

export const deleteJenisPertemuan = async (id) => {
    const jenisPertemuan = await JenisPertemuan.findByPk(id);

    if (!jenisPertemuan) {
        throw new NotFoundError(`Jenis Pertemuan tidak ditemukan`);
    }

    await jenisPertemuan.destroy();
};
