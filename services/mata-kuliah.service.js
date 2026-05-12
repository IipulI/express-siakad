import { getPagination } from "../utils/pagination.js";
import models from "../models/index.js"
import { NotFoundError } from "../utils/custom-error.js";

const { sequelize, MataKuliah, ProgramStudi, TahunKurikulum } = models;

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

        const { count, rows } = await MataKuliah.findAndCountAll(queryBuilder);

        return {
            count,
            rows,
            isPaginated: true
        }
    } else {
        const  data = await MataKuliah.findAll(queryBuilder);

        return {
            count: data.length,
            rows: data,
            isPaginated: false
        }
    }
}

export const findOne = async (id) => {
    const cekDataMataKuliah = await MataKuliah.findByPk(id)

    if (!cekDataMataKuliah) {
        throw new NotFoundError("Mata Kuliah tidak dapat ditemukan")
    }

    return cekDataMataKuliah
}

export const createMataKuliah = async (mataKuliahData) => {

    const programStudiExist = await ProgramStudi.findByPk(mataKuliahData.siakProgramStudiId)
    if (!programStudiExist) {
        throw new Error(`Program studi tidak ditemukan`);
    }

    const tahunKurikulum = await TahunKurikulum.findByPk(mataKuliahData.siakTahunKurikulumId)
    if (!tahunKurikulum) {
        throw new Error(`Tahun kurikulum tidak ditemukan`);
    }

    return sequelize.transaction(async (t) => {
        await validatePrasyarat(mataKuliahData, t);

        const createdMataKuliah = await MataKuliah.create(
            {
                siakProgramStudiId: mataKuliahData.siakProgramStudiId,
                siakTahunKurikulumId: mataKuliahData.siakTahunKurikulumId,

                siakBidangIlmuId : mataKuliahData.siakBidangIlmuId,
                siakJenisMataKuliahId : mataKuliahData.siakJenisMataKuliahId,
                siakKelompokMataKuliahId : mataKuliahData.siakKelompokMataKuliahId,

                nama: mataKuliahData.nama,
                kode: mataKuliahData.kode,
                jenis: mataKuliahData.jenis,
                adaPraktikum: mataKuliahData.adaPraktikum,
                sksTatapMuka: mataKuliahData.sksTatapMuka,
                sksPraktikum: mataKuliahData.sksPraktikum,
                sksPraktikLapangan: mataKuliahData.sksPraktikLapangan,
                totalSks: mataKuliahData.sksTatapMuka + mataKuliahData.sksPraktikum + mataKuliahData.sksPraktikLapangan,

                prasyaratMataKuliah1: mataKuliahData.prasyaratMataKuliah1Id,
                prasyaratMataKuliah2: mataKuliahData.prasyaratMataKuliah2Id,
                prasyaratMataKuliah3: mataKuliahData.prasyaratMataKuliah3Id
            },
            {
                transaction: t,
            }
        )

        // return if success
        return createdMataKuliah
    })
}

export const updateMataKuliah = async (id, mataKuliahData) => {
    return await sequelize.transaction(async(t) => {
        const existMataKuliah = await MataKuliah.findByPk(id);
        if (!existMataKuliah) {
            throw new Error(`Mata Kuliah tidak ditemukan`);
        }

        await validatePrasyarat(mataKuliahData, t);

        const data = {
            nama: mataKuliahData.nama,
            kode: mataKuliahData.kode,
            jenis: mataKuliahData.jenis,
            adaPraktikum: mataKuliahData.adaPraktikum,
            sksTatapMuka: mataKuliahData.sksTatapMuka,
            sksPraktikum: mataKuliahData.sksPraktikum,
            sksPraktikLapangan: mataKuliahData.sksPraktikLapangan,
            totalSks: mataKuliahData.sksTatapMuka + mataKuliahData.sksPraktikum + mataKuliahData.sksPraktikLapangan,

            prasyaratMataKuliah1: mataKuliahData.prasyaratMataKuliah1Id,
            prasyaratMataKuliah2: mataKuliahData.prasyaratMataKuliah2Id,
            prasyaratMataKuliah3: mataKuliahData.prasyaratMataKuliah3Id
        }

        return existMataKuliah.update(data, {
            transaction: t,
        })
    })
}

export const deleteMataKuliah = async (id) => {
    const cekDataMataKuliah = await MataKuliah.findByPk(id)
    if (!cekDataMataKuliah) {
        throw new NotFoundError("Mata Kuliah tidak dapat ditemukan")
    }

    await cekDataMataKuliah.destroy()
}

// Private function
const validatePrasyarat = async (mataKuliahData, transaction) => {
    for (let i = 1; i <= 3; i++) {
        const prasyaratId = mataKuliahData[`prasyaratMataKuliah${i}Id`];
        if (prasyaratId != null) {
            const prasyarat = await MataKuliah.findByPk(prasyaratId, {
                transaction,
                lock: transaction.LOCK
            });
            if (!prasyarat) {
                throw new Error(`Prasyarat Mata Kuliah ${i} tidak ditemukan`);
            }
        }
    }
}