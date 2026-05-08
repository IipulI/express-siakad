import { Op } from "sequelize";
import models from "../models/index.js";
import { getPagination } from "../utils/pagination.js";
import { NotFoundError, UnprocessableEntityError } from "../utils/custom-error.js";

const { BatasSks } = models;

export const findAll = async (page, size) => {
    const isPaginated = page !== null && size !== null

    const queryBuilder = {
        attributes: [
            "id",
            "siakJenjangId",
            "ipsMin",
            "ipsMax",
            "batasSks"
        ],
    }

    if (isPaginated) {
        const { limit, offset } = getPagination(page, size);
        queryBuilder.limit = limit;
        queryBuilder.offset = offset;

        const { count, rows } = await BatasSks.findAndCountAll(queryBuilder);

        return {
            count,
            rows,
            isPaginated: true,
        };
    } else {
        const data = await BatasSks.findAll(queryBuilder);

        return {
            count: data.length,
            rows: data,
            isPaginated: false,
        };
    }
};

export const findOneById = async(id) => {
    const batasSks = BatasSks.findOne({
        attributes: [
            'id',
            'siakJenjangId',
            'ipsMin',
            'ipsMax',
            'batasSks'
        ],
        where: {
            id: id
        }
    })

    if (!batasSks) {
        throw new NotFoundError(`Batas Sks tidak ditemukan`)
    }

    return batasSks
}


export const createBatasSks = async (batasSksData) => {
    const { siakJenjangId, ipsMin, ipsMax, batasSks } = batasSksData;

    if (parseFloat(ipsMax) < parseFloat(ipsMin)) {
        throw new UnprocessableEntityError("Nilai maksimal ips tidak boleh lebih kecil dari minimal ips");
    }

    // Cek apakah ada range yang beririsan untuk siakJenjangId yang sama
    const overlap = await BatasSks.findOne({
        where: {
            siakJenjangId,
            [Op.and]: [
                { ipsMin: { [Op.lte]: ipsMax } },
                { ipsMax: { [Op.gte]: ipsMin } }
            ]
        }
    });

    if (overlap) {
        throw new UnprocessableEntityError(`Range IPS (${ipsMin} - ${ipsMax}) beririsan dengan data yang sudah ada (Range: ${overlap.ipsMin} - ${overlap.ipsMax})`);
    }

    return await BatasSks.create({
        siakJenjangId,
        ipsMin,
        ipsMax,
        batasSks
    });
};

export const updateBatasSks = async (id, batasSksData) => {
    const { siakJenjangId, ipsMin, ipsMax, batasSks } = batasSksData;

    const cekDataBatasSks = await BatasSks.findByPk(id);
    if (!cekDataBatasSks) {
        throw new NotFoundError(`Batas Sks tidak ditemukan`);
    }

    if (parseFloat(ipsMax) < parseFloat(ipsMin)) {
        throw new Error("Nilai maksimal ips tidak boleh lebih kecil dari minimal ips");
    }

    // Cek apakah ada range yang beririsan untuk siakJenjangId yang sama, selain record ini sendiri
    const overlap = await BatasSks.findOne({
        where: {
            siakJenjangId: siakJenjangId,
            id: { [Op.ne]: id },
            [Op.and]: [
                { ipsMin: { [Op.lte]: ipsMax } },
                { ipsMax: { [Op.gte]: ipsMin } }
            ]
        }
    });

    if (overlap) {
        throw new Error(`Range IPS (${ipsMin} - ${ipsMax}) beririsan dengan data yang sudah ada (Range: ${overlap.ipsMin} - ${overlap.ipsMax})`);
    }

    return await cekDataBatasSks.update({
        siakJenjangId,
        ipsMin,
        ipsMax,
        batasSks
    })
}

export const deleteBatasSks = async (id) => {
    const cekDataBatasSks = await BatasSks.findByPk(id)

    if (!cekDataBatasSks) {
        throw new NotFoundError(`Batas Sks tidak ditemukan`)
    }

    await cekDataBatasSks.destroy()
};