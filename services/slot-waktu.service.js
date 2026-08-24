import models from "../models/index.js";
import { Op } from "sequelize";
import { getPagination } from "../utils/pagination.js";
import { ConflictError, NotFoundError } from "../utils/custom-error.js";

const { SlotWaktu } = models;

export const findAll = async (page, size) => {
    const isPaginated = page !== null && size !== null;

    const queryBuilder = {
        attributes: ['id', 'nama', 'jamMulai', 'jamSelesai'],
        order: [['jamMulai', 'ASC']],
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
        attributes: ['id', 'nama', 'jamMulai', 'jamSelesai'],
    });

    if (!slotWaktu) {
        throw new NotFoundError(`Slot Waktu tidak ditemukan`);
    }

    return slotWaktu;
};

export const createSlotWaktu = async (payload) => {
    const { nama, jamMulai, jamSelesai } = payload;

    const existing = await SlotWaktu.findOne({
        attributes: ['id'],
        where: { nama: { [Op.iLike]: nama } },
    });
    if (existing) {
        throw new ConflictError(`Slot Waktu : ${nama} sudah ada.`);
    }

    return await SlotWaktu.create({ nama, jamMulai, jamSelesai });
};

export const updateSlotWaktu = async (id, payload) => {
    const { nama, jamMulai, jamSelesai } = payload;

    const slotWaktu = await SlotWaktu.findByPk(id);
    if (!slotWaktu) {
        throw new NotFoundError(`Slot Waktu tidak ditemukan`);
    }

    const existing = await SlotWaktu.findOne({
        where: { nama: { [Op.iLike]: nama } },
    });
    if (existing && existing.id !== id) {
        throw new ConflictError(`Slot Waktu : ${nama} sudah ada.`);
    }

    return slotWaktu.update({ nama, jamMulai, jamSelesai });
};

export const deleteSlotWaktu = async (id) => {
    const slotWaktu = await SlotWaktu.findByPk(id);

    if (!slotWaktu) {
        throw new NotFoundError(`Slot Waktu tidak ditemukan`);
    }

    await slotWaktu.destroy();
};
