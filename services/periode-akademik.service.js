import db from '../models/index.js'
import { getPagination } from "../utils/pagination.js";
import { NotFoundError } from "../utils/custom-error.js";

const { PeriodeAkademik } = db

export const findAll = async (page, size) => {
    const isPaginated = page !== null && size !== null

    let queryBuilder = {
        attributes: {
            exclude: ['createdAt', 'updatedAt', 'deletedAt']
        },
        order: [['kode', 'DESC']],
    }

    if (isPaginated) {
        const { limit, offset } = getPagination(page, size);
        queryBuilder.limit = limit;
        queryBuilder.offset = offset;

        const { count, rows} = await PeriodeAkademik.findAndCountAll(queryBuilder);

        return {
            count,
            rows,
            isPaginated,
        }
    } else {
        const data = await PeriodeAkademik.findAll(queryBuilder);

        return {
            count: data.length,
            rows: data,
            isPaginated: false,
        }
    }
}

export const findActive = async () => {
    const activePeriod = await PeriodeAkademik.findOne({
        attributes: {
            exclude: ['createdAt', 'updatedAt', 'deletedAt']
        },
        where: { status: "Aktif" }
    })

    if(!activePeriod) {
        throw new Error('Tidak ada periode aktif yang ditemukan');
    }

    return activePeriod;
}

export const createPeriodeAkademik = async (periodeAkademikData) => {
    const { siakTahunAjaranId, nama, kode, tanggalMulai, tanggalSelesai } = periodeAkademikData;

    const tahunAjaranExist = await TahunAjaranModels.findByPk(periodeAkademikData.siakTahunAjaranId);
    if (!tahunAjaranExist) {
        throw new Error (`Tahun Ajaran tidak ditemukan`)
    }

    return await PeriodeAkademik.create({
        siak_tahun_ajaran_id: siakTahunAjaranId,
        nama,
        kode,
        tanggal_mulai: tanggalMulai,
        tanggal_selesai: tanggalSelesai,
        status: "Inaktif"
    })
}

export const updatePeriodeAkademik = async (id, updateData) => {
    const existDataPeriodeAkademik = await PeriodeAkademik.findByPk(id)

    if (!existDataPeriodeAkademik) {
        throw new NotFoundError(`Periode Akademik tidak dapat ditemukan`)
    }

    return existDataPeriodeAkademik.update(updateData)
};

export const deletePeriodeAkademik = async (id) => {
    const existDataPeriodeAkademik = await PeriodeAkademik.findByPk(id)
    if (!existDataPeriodeAkademik) {
        throw new NotFoundError(`Periode Akademik tidak dapat ditemukan`)
    }

    await existDataPeriodeAkademik.destroy()
};
