import models from "../models/index.js";
import { Op } from "sequelize";
import { getPagination } from "../utils/pagination.js";
import { ConflictError, NotFoundError } from "../utils/custom-error.js";

const { JasAlmamater } = models;

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

        const { count, rows } = await JasAlmamater.findAndCountAll(queryBuilder);

        return {
            count,
            rows,
            isPaginated: true,
        };
    } else {
        const data = await JasAlmamater.findAll(queryBuilder);

        return {
            count: data.length,
            rows: data,
            isPaginated: false,
        };
    }
};

export const findOneById = async (id) => {
    const jasAlmamater = await JasAlmamater.findByPk(id, {
        attributes: ['id', 'nama'],
    });

    if (!jasAlmamater) {
        throw new NotFoundError(`Jas Almamater tidak ditemukan`);
    }

    return jasAlmamater;
};

export const createJasAlmamater = async (payload) => {
    const { nama } = payload;

    const existing = await JasAlmamater.findOne({
        attributes: ['id'],
        where: { nama: { [Op.iLike]: nama } },
    });
    if (existing) {
        throw new ConflictError(`Jas Almamater : ${nama} sudah ada.`);
    }

    return await JasAlmamater.create({ nama });
};

export const updateJasAlmamater = async (id, payload) => {
    const { nama } = payload;

    const jasAlmamater = await JasAlmamater.findByPk(id);
    if (!jasAlmamater) {
        throw new NotFoundError(`Jas Almamater tidak ditemukan`);
    }

    const existing = await JasAlmamater.findOne({
        where: { nama: { [Op.iLike]: nama } },
    });
    if (existing && existing.id !== id) {
        throw new ConflictError(`Jas Almamater : ${nama} sudah ada.`);
    }

    return jasAlmamater.update({ nama });
};

export const deleteJasAlmamater = async (id) => {
    const jasAlmamater = await JasAlmamater.findByPk(id);

    if (!jasAlmamater) {
        throw new NotFoundError(`Jas Almamater tidak ditemukan`);
    }

    await jasAlmamater.destroy();
};
