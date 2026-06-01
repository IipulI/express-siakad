import models from "../models/index.js";
import { Op } from "sequelize";
import { getPagination } from "../utils/pagination.js";
import { NotFoundError, UnprocessableEntityError } from "../utils/custom-error.js";

const {
    TahunKurikulum,
    PeriodeAkademik,
    BatasSks
} = models;

// Helper format tanggal
const formatIndoDate = (dateString) => {
    if (!dateString) return '-';
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(dateString));
};

export const getBatasSksList = async (jenjangId, tahunKurikulumId) => {
    // 1. Ambil Data Header Kurikulum
    const kurikulum = await TahunKurikulum.findByPk(tahunKurikulumId, {
        attributes: ['tahun', 'keterangan', 'tanggalMulai', 'tanggalSelesai'],
        include: [{ model: PeriodeAkademik, as: 'periodeAkademik', attributes: ['nama'] }]
    });

    if (!kurikulum) throw new NotFoundError("Data Tahun Kurikulum tidak ditemukan");

    const headerLengkap = {
        kurikulum: kurikulum.tahun,
        keterangan: kurikulum.keterangan || '-',
        mulaiBerlaku: kurikulum.periodeAkademik ? kurikulum.periodeAkademik.nama : `${kurikulum.tahun} Ganjil`,
        tanggalAwal: formatIndoDate(kurikulum.tanggalMulai),
        tanggalAkhir: formatIndoDate(kurikulum.tanggalSelesai)
    };

    // 2. Ambil Data Tabel Batas SKS
    const rawData = await BatasSks.findAll({
        where: { siak_jenjang_id: jenjangId },
        order: [['ips_min', 'ASC']] // Urutkan dari IPS terkecil
    });

    // Rapikan nama field jadi camelCase biar seragam
    const listBatasSks = rawData.map(item => ({
        id: item.id,
        siakJenjangId: item.siakJenjangId || item.siak_jenjang_id,
        ipsMin: parseFloat(item.ipsMin || item.ips_min || 0),
        ipsMax: parseFloat(item.ipsMax || item.ips_max || 0),
        batasSks: parseInt(item.batasSks || item.batas_sks || 0)
    }));

    // Return Header + Tabel Data
    return {
        header: headerLengkap,
        batasSks: listBatasSks
    };
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


// ==========================================
// 2. CREATE (POST)
// ==========================================
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

// ==========================================
// 3. UPDATE (PUT)
// ==========================================
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

// ==========================================
// 4. DELETE (DELETE)
// ==========================================
export const deleteBatasSks = async (id) => {
    const cekDataBatasSks = await BatasSks.findByPk(id)

    if (!cekDataBatasSks) {
        throw new NotFoundError(`Batas Sks tidak ditemukan`)
    }

    await cekDataBatasSks.destroy()
};