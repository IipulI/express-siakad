import models from "../models/index.js";
import { Op } from "sequelize";
import { NotFoundError, UnprocessableEntityError, BadRequestError } from "../utils/custom-error.js";

const {
    TahunKurikulum,
    PeriodeAkademik,
    Jenjang,
    BatasSks
} = models;

// Helper format tanggal
const formatIndoDate = (dateString) => {
    if (!dateString) return '-';
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(dateString));
};

// Cari Batas SKS sumber: utamakan match persis tahunKurikulumId, kalau belum
// ada (data lama sebelum fitur ini di-scope per Tahun Kurikulum) fallback ke
// baris tanpa tahun kurikulum (legacy/baseline) untuk jenjang yang sama.
const _cariBatasSksAsal = async (jenjangId, tahunKurikulumId) => {
    let rows = await BatasSks.findAll({
        where: { siak_jenjang_id: jenjangId, siak_tahun_kurikulum_id: tahunKurikulumId },
        order: [['ips_min', 'ASC']]
    });
    if (rows.length === 0) {
        rows = await BatasSks.findAll({
            where: { siak_jenjang_id: jenjangId, siak_tahun_kurikulum_id: null },
            order: [['ips_min', 'ASC']]
        });
    }
    return rows;
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

    // 2. Ambil Data Tabel Batas SKS -- scoping per Jenjang + Tahun Kurikulum
    // (sebelumnya BUG: tahunKurikulumId diterima tapi tidak dipakai filter,
    // jadi semua tahun kurikulum berbagi 1 tabel yang sama untuk 1 jenjang)
    const rawData = await BatasSks.findAll({
        where: { siak_jenjang_id: jenjangId, siak_tahun_kurikulum_id: tahunKurikulumId },
        order: [['ips_min', 'ASC']]
    });

    const listBatasSks = rawData.map(item => ({
        id: item.id,
        siakJenjangId: item.siakJenjangId,
        ipsMin: parseFloat(item.ipsMin || 0),
        ipsMax: parseFloat(item.ipsMax || 0),
        batasSks: parseInt(item.batasSks || 0)
    }));

    return {
        header: headerLengkap,
        batasSks: listBatasSks
    };
};

export const findOneById = async (id) => {
    const batasSks = await BatasSks.findByPk(id, {
        attributes: ['id', 'siakJenjangId', 'siakTahunKurikulumId', 'ipsMin', 'ipsMax', 'batasSks']
    });

    if (!batasSks) {
        throw new NotFoundError(`Batas Sks tidak ditemukan`);
    }

    return batasSks;
};

// ==========================================
// 2. CREATE (POST)
// ==========================================
export const createBatasSks = async (batasSksData) => {
    const { siakJenjangId, siakTahunKurikulumId, ipsMin, ipsMax, batasSks } = batasSksData;

    if (!siakTahunKurikulumId) throw new BadRequestError("Tahun Kurikulum wajib diisi");
    if (parseFloat(ipsMax) < parseFloat(ipsMin)) {
        throw new UnprocessableEntityError("Nilai maksimal ips tidak boleh lebih kecil dari minimal ips");
    }

    // Cek apakah ada range yang beririsan untuk jenjang + tahun kurikulum yang sama
    const overlap = await BatasSks.findOne({
        where: {
            siakJenjangId,
            siakTahunKurikulumId,
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
        siakTahunKurikulumId,
        ipsMin,
        ipsMax,
        batasSks
    });
};

// ==========================================
// 3. UPDATE (PUT)
// ==========================================
export const updateBatasSks = async (id, batasSksData) => {
    const { siakJenjangId, siakTahunKurikulumId, ipsMin, ipsMax, batasSks } = batasSksData;

    const cekDataBatasSks = await BatasSks.findByPk(id);
    if (!cekDataBatasSks) {
        throw new NotFoundError(`Batas Sks tidak ditemukan`);
    }

    if (!siakTahunKurikulumId) throw new BadRequestError("Tahun Kurikulum wajib diisi");
    if (parseFloat(ipsMax) < parseFloat(ipsMin)) {
        throw new Error("Nilai maksimal ips tidak boleh lebih kecil dari minimal ips");
    }

    const overlap = await BatasSks.findOne({
        where: {
            siakJenjangId,
            siakTahunKurikulumId,
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
        siakTahunKurikulumId,
        ipsMin,
        ipsMax,
        batasSks
    });
};

// ==========================================
// 4. DELETE (DELETE)
// ==========================================
export const deleteBatasSks = async (id) => {
    const cekDataBatasSks = await BatasSks.findByPk(id);

    if (!cekDataBatasSks) {
        throw new NotFoundError(`Batas Sks tidak ditemukan`);
    }

    await cekDataBatasSks.destroy();
};

// =========================================================
// PRATINJAU SALIN Batas SKS (lihat isi sumber sebelum disalin)
// =========================================================
export const pratinjauSalinBatasSks = async (jenjangIdAsal, tahunKurikulumIdAsal) => {
    const batasSksAsal = await _cariBatasSksAsal(jenjangIdAsal, tahunKurikulumIdAsal);
    if (batasSksAsal.length === 0) throw new NotFoundError("Batas SKS pada Jenjang & Tahun Kurikulum asal belum diisi");

    const jenjang = await Jenjang.findByPk(jenjangIdAsal, { attributes: ['jenjang'] });
    const kurikulum = await TahunKurikulum.findByPk(tahunKurikulumIdAsal, { attributes: ['tahun'] });

    return {
        jenjangAsal: jenjang?.jenjang || '-',
        tahunKurikulumAsal: kurikulum?.tahun || '-',
        batasSks: batasSksAsal.map(b => ({
            ipsMin: parseFloat(b.ipsMin || 0),
            ipsMax: parseFloat(b.ipsMax || 0),
            batasSks: parseInt(b.batasSks || 0)
        }))
    };
};

// =========================================================
// SALIN Batas SKS (wipe & replace tujuan: jenjang + tahun kurikulum tujuan)
// =========================================================
export const salinBatasSks = async (payload) => {
    const { jenjangIdAsal, tahunKurikulumIdAsal, jenjangIdTujuan, tahunKurikulumIdTujuan } = payload;

    if (!tahunKurikulumIdTujuan) throw new BadRequestError("Tahun Kurikulum tujuan wajib diisi");

    const batasSksAsal = await _cariBatasSksAsal(jenjangIdAsal, tahunKurikulumIdAsal);
    if (batasSksAsal.length === 0) throw new NotFoundError("Batas SKS pada Jenjang & Tahun Kurikulum asal belum diisi");

    return await models.sequelize.transaction(async (trx) => {
        await BatasSks.destroy({
            where: { siak_jenjang_id: jenjangIdTujuan, siak_tahun_kurikulum_id: tahunKurikulumIdTujuan },
            force: true,
            transaction: trx
        });

        const dataBaru = batasSksAsal.map(b => ({
            siakJenjangId: jenjangIdTujuan,
            siakTahunKurikulumId: tahunKurikulumIdTujuan,
            ipsMin: b.ipsMin,
            ipsMax: b.ipsMax,
            batasSks: b.batasSks
        }));
        await BatasSks.bulkCreate(dataBaru, { transaction: trx });

        return { jumlahDisalin: dataBaru.length };
    });
};
