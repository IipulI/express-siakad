import models from "../models/index.js";
import { Op } from "sequelize";
import { getPagination } from "../utils/pagination.js";
import { ConflictError, NotFoundError } from "../utils/custom-error.js";

const { SlotWaktu } = models;

export const findAll = async (page, size) => {
    const isPaginated = page !== null && size !== null;

    const queryBuilder = {
        attributes: ['id', 'waktu'],
        order: [['waktu', 'ASC']],
    };

    if (isPaginated) {
        const { limit, offset } = getPagination(page, size);
        queryBuilder.limit = limit;
        queryBuilder.offset = offset;

        const { count, rows } = await SlotWaktu.findAndCountAll(queryBuilder);

        return {
            count,
            rows,
            isPaginated: true,
        };
    } else {
        const data = await SlotWaktu.findAll(queryBuilder);

        return {
            count: data.length,
            rows: data,
            isPaginated: false,
        };
    }
};

export const findOneById = async (id) => {
    const slotWaktu = await SlotWaktu.findByPk(id, {
        attributes: ['id', 'waktu'],
    });

    if (!slotWaktu) {
        throw new NotFoundError(`Slot Waktu tidak ditemukan`);
    }

    return slotWaktu;
};

export const createSlotWaktu = async (payload) => {
    const { waktu } = payload;

    const existing = await SlotWaktu.findOne({
        attributes: ['id'],
        where: { waktu },
    });
    if (existing) {
        throw new ConflictError(`Slot Waktu : ${waktu} sudah ada.`);
    }

    return await SlotWaktu.create({ waktu });
};

export const updateSlotWaktu = async (id, payload) => {
    const { waktu } = payload;

    const slotWaktu = await SlotWaktu.findByPk(id);
    if (!slotWaktu) {
        throw new NotFoundError(`Slot Waktu tidak ditemukan`);
    }

    const existing = await SlotWaktu.findOne({
        where: { waktu },
    });
    if (existing && existing.id !== id) {
        throw new ConflictError(`Slot Waktu : ${waktu} sudah ada.`);
    }

    return slotWaktu.update({ waktu });
};

export const deleteSlotWaktu = async (id) => {
    const slotWaktu = await SlotWaktu.findByPk(id);

    if (!slotWaktu) {
        throw new NotFoundError(`Slot Waktu tidak ditemukan`);
    }

    await slotWaktu.destroy();
};
