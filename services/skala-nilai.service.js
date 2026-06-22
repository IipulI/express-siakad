import models from '../models/index.js';
import * as CustomError from '../utils/custom-error.js';

const formatIndoDate = (dateString) => {
    if (!dateString) return '-';
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(dateString));
};

export const getSkalaNilaiList = async (params) => {
    const { jenjangId, tahunKurikulumId, periodeId } = params;
    const { TahunKurikulum, PeriodeAkademik, Jenjang, SkalaPenilaian } = models;

    const kurikulum = await TahunKurikulum.findByPk(tahunKurikulumId, {
        attributes: ['tahun', 'keterangan', 'tanggalMulai', 'tanggalSelesai'],
        include: [{ model: PeriodeAkademik, as: 'periodeAkademik', attributes: ['nama'] }]
    });
    if (!kurikulum) throw new CustomError.NotFoundError("Data Tahun Kurikulum tidak ditemukan");

    const jenjang = await Jenjang.findByPk(jenjangId, { attributes: ['jenjang'] });
    if (!jenjang) throw new CustomError.NotFoundError("Data Jenjang tidak ditemukan");

    const headerLengkap = {
        kurikulum: kurikulum.tahun,
        keterangan: kurikulum.keterangan || '-',
        jenjang: jenjang.jenjang,
        mulaiBerlaku: kurikulum.periodeAkademik ? kurikulum.periodeAkademik.nama : `${kurikulum.tahun} Ganjil`,
        tanggalAwal: formatIndoDate(kurikulum.tanggalMulai),
        tanggalAkhir: formatIndoDate(kurikulum.tanggalSelesai)
    };

    const whereClause = { siak_jenjang_id: jenjangId, siak_tahun_kurikulum_id: tahunKurikulumId };
    if (periodeId) {
        whereClause.siak_periode_akademik_id = periodeId;
    }

    const daftarPeriode = await PeriodeAkademik.findAll({
        attributes: ['id', 'nama', 'status'],
        order: [['nama', 'DESC']]
    });

    const listSkalaNilai = await SkalaPenilaian.findAll({
        where: whereClause,
        order: [['angkaMutu', 'DESC']]
    });

    const formattedSkalaNilai = listSkalaNilai.map(item => ({
        id: item.id,
        grade: item.hurufMutu,
        bobot: parseFloat(item.angkaMutu || 0),
        nilaiBawah: parseFloat(item.nilaiMin || 0),
        nilaiAtas: parseFloat(item.nilaiMax || 0),
        keterangan: item.keterangan || '-',
        nilaiDefault: item.isDefault || false
    }));

    return {
        header: headerLengkap,
        daftarPeriode: daftarPeriode,
        skalaNilai: formattedSkalaNilai
    };
};

export const upsertSkalaNilai = async (payload) => {
    const { SkalaPenilaian } = models;
    const { tahunKurikulumId, jenjangId, periodeId, dataSkala } = payload;

    if (!jenjangId) throw new CustomError.BadRequestError("Jenjang wajib diisi");
    if (!periodeId) throw new CustomError.BadRequestError("Berlaku Sejak Periode wajib diisi");

    const trx = await models.sequelize.transaction();
    try {
        // Wipe & replace -- scoping LENGKAP (jenjang + kurikulum + periode),
        // supaya tidak menimpa data periode lain untuk jenjang/kurikulum yang sama.
        await SkalaPenilaian.destroy({
            where: {
                siak_jenjang_id: jenjangId,
                siak_tahun_kurikulum_id: tahunKurikulumId,
                siak_periode_akademik_id: periodeId
            },
            force: true,
            transaction: trx
        });

        for (const item of dataSkala) {
            await SkalaPenilaian.create({
                siakTahunKurikulumId: tahunKurikulumId,
                siakJenjangId: jenjangId,
                siakPeriodeAkademikId: periodeId,
                hurufMutu: item.grade,
                angkaMutu: item.bobot,
                nilaiMin: item.nilaiBawah,
                nilaiMax: item.nilaiAtas,
                keterangan: item.keterangan,
                isDefault: item.nilaiDefault
            }, { transaction: trx });
        }

        await trx.commit();
        return true;
    } catch (error) {
        await trx.rollback();
        throw error;
    }
};

export const deleteSkalaNilai = async (id) => {
    const { SkalaPenilaian } = models;
    const data = await SkalaPenilaian.findByPk(id);
    if (!data) throw new CustomError.NotFoundError("Data Skala Nilai tidak ditemukan");
    return await data.destroy();
};

// Cari Skala Nilai sumber: utamakan yang match persis periodeId-nya, kalau
// belum ada (mis. data lama sebelum fitur ini di-scope per periode), fallback
// ke baris tanpa periode (legacy/baseline) untuk jenjang+kurikulum yang sama.
const _cariSkalaAsal = async (jenjangId, tahunKurikulumId, periodeId) => {
    const { SkalaPenilaian } = models;
    const opsiUmum = { where: { siak_jenjang_id: jenjangId, siak_tahun_kurikulum_id: tahunKurikulumId }, order: [['angkaMutu', 'DESC']] };

    let rows = await SkalaPenilaian.findAll({ ...opsiUmum, where: { ...opsiUmum.where, siak_periode_akademik_id: periodeId } });
    if (rows.length === 0) {
        rows = await SkalaPenilaian.findAll({ ...opsiUmum, where: { ...opsiUmum.where, siak_periode_akademik_id: null } });
    }
    return rows;
};

// =========================================================
// PRATINJAU SALIN Skala Nilai (lihat isi sumber sebelum disalin)
// =========================================================
export const pratinjauSalinSkalaNilai = async (jenjangIdAsal, tahunKurikulumIdAsal, periodeIdAsal) => {
    const { Jenjang, TahunKurikulum } = models;

    const skalaAsal = await _cariSkalaAsal(jenjangIdAsal, tahunKurikulumIdAsal, periodeIdAsal);
    if (skalaAsal.length === 0) throw new CustomError.NotFoundError("Skala Nilai pada Jenjang & Tahun Kurikulum asal belum diisi");

    const jenjang = await Jenjang.findByPk(jenjangIdAsal, { attributes: ['jenjang'] });
    const kurikulum = await TahunKurikulum.findByPk(tahunKurikulumIdAsal, { attributes: ['tahun'] });

    return {
        jenjangAsal: jenjang?.jenjang || '-',
        tahunKurikulumAsal: kurikulum?.tahun || '-',
        skalaNilai: skalaAsal.map(s => ({
            grade: s.hurufMutu,
            bobot: parseFloat(s.angkaMutu || 0),
            nilaiBawah: parseFloat(s.nilaiMin || 0),
            nilaiAtas: parseFloat(s.nilaiMax || 0),
            keterangan: s.keterangan || '-',
            nilaiDefault: s.isDefault || false
        }))
    };
};

// =========================================================
// SALIN Skala Nilai (wipe & replace tujuan: jenjang + kurikulum + periode tujuan)
// =========================================================
export const salinSkalaNilai = async (payload) => {
    const { SkalaPenilaian } = models;
    const { jenjangIdAsal, tahunKurikulumIdAsal, periodeIdAsal, jenjangIdTujuan, tahunKurikulumIdTujuan, periodeIdTujuan } = payload;

    if (!periodeIdAsal) throw new CustomError.BadRequestError("Berlaku Sejak Periode (asal) wajib diisi");
    if (!periodeIdTujuan) throw new CustomError.BadRequestError("Berlaku Sejak Periode (tujuan) wajib diisi");

    const skalaAsal = await _cariSkalaAsal(jenjangIdAsal, tahunKurikulumIdAsal, periodeIdAsal);
    if (skalaAsal.length === 0) throw new CustomError.NotFoundError("Skala Nilai pada Jenjang & Tahun Kurikulum asal belum diisi");

    return await models.sequelize.transaction(async (trx) => {
        await SkalaPenilaian.destroy({
            where: {
                siak_jenjang_id: jenjangIdTujuan,
                siak_tahun_kurikulum_id: tahunKurikulumIdTujuan,
                siak_periode_akademik_id: periodeIdTujuan
            },
            force: true,
            transaction: trx
        });

        const dataBaru = skalaAsal.map(s => ({
            siakTahunKurikulumId: tahunKurikulumIdTujuan,
            siakJenjangId: jenjangIdTujuan,
            siakPeriodeAkademikId: periodeIdTujuan,
            hurufMutu: s.hurufMutu,
            angkaMutu: s.angkaMutu,
            nilaiMin: s.nilaiMin,
            nilaiMax: s.nilaiMax,
            keterangan: s.keterangan,
            isDefault: s.isDefault
        }));
        await SkalaPenilaian.bulkCreate(dataBaru, { transaction: trx });

        return { jumlahDisalin: dataBaru.length };
    });
};
