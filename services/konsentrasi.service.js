import models from "../models/index.js";
import { BadRequestError, ConflictError, NotFoundError } from "../utils/custom-error.js";

const { Konsentrasi } = models;

export const findAll = async (siakProgramStudiId) => {
    if (!siakProgramStudiId) {
        throw new BadRequestError("Parameter siakProgramStudiId wajib diisi");
    }

    return await Konsentrasi.findAll({
        where: { siakProgramStudiId },
        attributes: ["id", "siakProgramStudiId", "kode", "nama"],
        order: [["kode", "ASC"]],
    });
};

export const createKonsentrasi = async (konsentrasiData) => {
    const { siakProgramStudiId, kode } = konsentrasiData;

    const existingKonsentrasi = await Konsentrasi.findOne({
        where: { siakProgramStudiId, kode },
    });
    if (existingKonsentrasi) {
        throw new ConflictError(`Konsentrasi dengan kode : ${kode} sudah ada pada Program Studi ini`);
    }

    return await Konsentrasi.create(konsentrasiData);
};

export const updateKonsentrasi = async (id, updateData) => {
    const { siakProgramStudiId, kode, nama } = updateData;

    const cekDataKonsentrasi = await Konsentrasi.findByPk(id);
    if (!cekDataKonsentrasi) {
        throw new NotFoundError(`Konsentrasi tidak ditemukan`);
    }

    const existingKonsentrasi = await Konsentrasi.findOne({
        where: { siakProgramStudiId: siakProgramStudiId ?? cekDataKonsentrasi.siakProgramStudiId, kode },
    });
    if (existingKonsentrasi && existingKonsentrasi.id !== id) {
        throw new ConflictError(`Konsentrasi dengan kode : ${kode} sudah ada pada Program Studi ini.`);
    }

    return Konsentrasi.update({ siakProgramStudiId, kode, nama }, { where: { id } });
};

export const deleteKonsentrasi = async (id) => {
    const cekDataKonsentrasi = await Konsentrasi.findByPk(id);
    if (!cekDataKonsentrasi) {
        throw new NotFoundError(`Konsentrasi tidak ditemukan`);
    }

    await cekDataKonsentrasi.destroy();
};
