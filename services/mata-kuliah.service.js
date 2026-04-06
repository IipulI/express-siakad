import { getPagination } from "../utils/pagination.js";
import models from "../models/index.js"
import { Op } from 'sequelize';

const { sequelize, MataKuliah } = models;

export const findAll = async (page, size) => {
    try {
        if (page !== null && size !== null) {
            const { limit, offset } = getPagination(page, size);

            const { count, rows } = await MataKuliah.findAndCountAll({
                limit,
                offset,
                order: [['createdAt', 'DESC']],
            })

            return { count, rows, isPaginated: true }
        }
        else {
            const { count, rows } = await MataKuliah.findAndCountAll({})
            return { count, rows, isPaginated: false }
        }
    }
    catch (error) {
        throw new Error(`Terjadi kesalahan saat mengambil data: ${error.message}`);
    }
}

export const findOne = async (id) => {
    try {
        const existMataKuliah = await MataKuliah.findByPk(id)
        if (!existMataKuliah) {
            throw new Error(`MataKuliah doesn\'t exist`);
        }

        return existMataKuliah;
    }
    catch (error) {
        throw new Error(`Terjadi kesalahan saat mengambil data: ${error.message}`);
    }
}

export const createMataKuliah = async (mataKuliahData) => {
    try {
        const newMataKuliah = sequelize.transaction(async (t) => {

            if (mataKuliahData.prasyaratMataKuliah1Id != null) {
                const prasyaratMataKuliah1 = await MataKuliah.findByPk(mataKuliahData.prasyaratMataKuliah1Id, {
                    transaction: t,
                    lock: t.LOCK
                });
                if (!prasyaratMataKuliah1) {
                    throw new Error(`Prasyarat Mata Kuliah 1 tidak ditemukan`)
                }
            }
            if (mataKuliahData.prasyaratMataKuliah2Id != null) {
                const prasyaratMataKuliah2 = await MataKuliah.findByPk(mataKuliahData.prasyaratMataKuliah2Id, {
                    transaction: t,
                    lock: t.LOCK
                });
                if (!prasyaratMataKuliah2) {
                    throw new Error(`Prasyarat Mata Kuliah 2 tidak ditemukan`)
                }
            }
            if (mataKuliahData.prasyaratMataKuliah3Id != null) {
                const prasyaratMataKuliah3 = await MataKuliah.findByPk(mataKuliahData.prasyaratMataKuliah3Id, {
                    transaction: t,
                    lock: t.LOCK
                });
                if (!prasyaratMataKuliah3) {
                    throw new Error(`Prasyarat Mata Kuliah 3 tidak ditemukan`)
                }
            }


            const createdMataKuliah = await MataKuliah.create(
                {
                    siakProgramStudiId: mataKuliahData.siakProgramStudiId,
                    siakTahunKurikulumId: mataKuliahData.siakTahunKurikulumId,

                    siakBidangIlmuId : mataKuliahData.siakBidangIlmuId,
                    siakJenisMataKuliahId : mataKuliahData.siakJenisMataKuliahId,
                    siakKelompokMataKuliahId : mataKuliahData.siakKelompokMataKuliahId,

                    siakKelompokMataKuliahId: mataKuliahData.kelompokMataKuliahId,
                    siakRumpunMataKuliahId: mataKuliahData.rumpunMataKuliahId,

                    siakBidangIlmuId : mataKuliahData.siakBidangIlmuId,
                    siakJenisMataKuliahId : mataKuliahData.siakJenisMataKuliahId,
                    siakKelompokMataKuliahId : mataKuliahData.siakKelompokMataKuliahId,

                    nama: mataKuliahData.nama,
                    namaEn: mataKuliahData.namaEn,
                    kode: mataKuliahData.kode,
                    jenis: mataKuliahData.jenis,
                    adaPraktikum: mataKuliahData.adaPraktikum,

                    sksTatapMuka: mataKuliahData.sksTatapMuka,
                    sksPraktikum: mataKuliahData.sksPraktikum,
                    sksPraktikLapangan: mataKuliahData.sksPraktikLapangan,
                    sksSimulasi: mataKuliahData.sksSimulasi,
                    totalSks: (mataKuliahData.sksTatapMuka || 0) +
                              (mataKuliahData.sksPraktikum || 0) +
                              (mataKuliahData.sksPraktikLapangan || 0) +
                              (mataKuliahData.sksSimulasi || 0),

                    merupakanMku: mataKuliahData.merupakanMku,
                    adaSap: mataKuliahData.adaSap,
                    adaSilabus: mataKuliahData.adaSilabus,
                    adaBahanAjar: mataKuliahData.adaBahanAjar,
                    adaDiktat: mataKuliahData.adaDiktat,

                    koordinatorMkId: mataKuliahData.koordinatorMkId,

                    prasyaratMataKuliah1: mataKuliahData.prasyaratMataKuliah1Id,
                    prasyaratMataKuliah2: mataKuliahData.prasyaratMataKuliah2Id,
                    prasyaratMataKuliah3: mataKuliahData.prasyaratMataKuliah3Id
                },
                { transaction: t }
            );

            // Simpan Array Pengembang RPS ke tabel pivot
            if (mataKuliahData.pengembangRpsIds && mataKuliahData.pengembangRpsIds.length > 0) {
                await createdMataKuliah.setPengembangRps(mataKuliahData.pengembangRpsIds, { transaction: t });
            }

            return createdMataKuliah;
        });

        // Mengembalikan format detail lengkap setelah berhasil create
        return await getDetailMataKuliahObe(newMataKuliah.id);

    } catch (error) {
        console.error("🔴 ERROR DI SERVICE CREATE:", error);
        throw new Error(error.message);
    }
}

export const updateMataKuliah = async (id, mataKuliahData) => {
    try {
        const existMataKuliah = await MataKuliah.findByPk(id);
        if (!existMataKuliah) throw new Error(`Mata Kuliah tidak ditemukan`);

        await MataKuliah.update({
            siakProgramStudiId: mataKuliahData.siakProgramStudiId,
            siakTahunKurikulumId: mataKuliahData.siakTahunKurikulumId,
            siakKelompokMataKuliahId: mataKuliahData.kelompokMataKuliahId,
            siakRumpunMataKuliahId: mataKuliahData.rumpunMataKuliahId,
            nama: mataKuliahData.nama,
            namaEn: mataKuliahData.namaEn,
            kode: mataKuliahData.kode,
            jenis: mataKuliahData.jenis,
            adaPraktikum: mataKuliahData.adaPraktikum,

            sksTatapMuka: mataKuliahData.sksTatapMuka,
            sksPraktikum: mataKuliahData.sksPraktikum,
            sksPraktikLapangan: mataKuliahData.sksPraktikLapangan,
            sksSimulasi: mataKuliahData.sksSimulasi,
            totalSks: (mataKuliahData.sksTatapMuka || 0) +
                      (mataKuliahData.sksPraktikum || 0) +
                      (mataKuliahData.sksPraktikLapangan || 0) +
                      (mataKuliahData.sksSimulasi || 0),

            merupakanMku: mataKuliahData.merupakanMku,
            adaSap: mataKuliahData.adaSap,
            adaSilabus: mataKuliahData.adaSilabus,
            adaBahanAjar: mataKuliahData.adaBahanAjar,
            adaDiktat: mataKuliahData.adaDiktat,

            koordinator_mk_id: mataKuliahData.koordinatorMkId,

            prasyaratMataKuliah1: mataKuliahData.prasyaratMataKuliah1Id,
            prasyaratMataKuliah2: mataKuliahData.prasyaratMataKuliah2Id,
            prasyaratMataKuliah3: mataKuliahData.prasyaratMataKuliah3Id
        }, { where: { id: id } });

        // UPDATE DATA PENGEMBANG RPS DI TABEL PIVOT
        if (mataKuliahData.pengembangRpsIds) {
            await existMataKuliah.setPengembangRps(mataKuliahData.pengembangRpsIds);
        }

        // Mengembalikan format detail lengkap setelah berhasil update
        return await getDetailMataKuliahObe(id);
    } catch (error) {
        throw new Error(`Kesalahan saat memperbarui data: ${error.message}`);
    }
}

export const deleteMataKuliah = async (id) => {
    try {
        const deletedRowsCount = await MataKuliah.destroy({
            where: { id: id }
        })

        return deletedRowsCount > 0;
    }
    catch (error) {
        throw new Error(`Kesalahan saat menghapus Mata Kuliah: ${error.message}`);
    }
}