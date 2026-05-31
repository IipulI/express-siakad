
import models from '../models/index.js';
import * as CustomError from '../utils/custom-error.js'; // 👈 Import Custom Error

const formatIndoDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric'
    }).format(date);
};

export const getCplUmumList = async (tahunKurikulumId, search, kategori) => {
    const { TahunKurikulum, CplUmum, PeriodeAkademik, Sequelize } = models;

    const kurikulum = await TahunKurikulum.findByPk(tahunKurikulumId, {
        attributes: ['id', 'tahun', 'keterangan', 'tanggalMulai', 'tanggalSelesai'],
        include: [{
            model: PeriodeAkademik,
            as: 'periodeAkademik',
            attributes: ['nama']
        }]
    });

    if (!kurikulum) {
        throw new CustomError.NotFoundError("Tahun Kurikulum tidak ditemukan"); // 👈 Pakai Custom Error
    }

    const headerInfo = {
        kurikulum: kurikulum.tahun,
        keterangan: kurikulum.keterangan || '-',
        mulaiBerlaku: kurikulum.periodeAkademik ? kurikulum.periodeAkademik.nama : `${kurikulum.tahun} Ganjil`,
        tanggalAwal: formatIndoDate(kurikulum.tanggalMulai),
        tanggalAkhir: formatIndoDate(kurikulum.tanggalSelesai),
    };

    let dataCpl = [];
    if (CplUmum) {
        const whereClause = { siak_tahun_kurikulum_id: tahunKurikulumId };

        if (kategori && kategori !== '-- Pilih Kategori --' && kategori !== '') {
            whereClause.kategori = kategori;
        }

        if (search) {
            whereClause[Sequelize.Op.or] = [
                { kode: { [Sequelize.Op.iLike]: `%${search}%` } },
                { deskripsiInd: { [Sequelize.Op.iLike]: `%${search}%` } }
            ];
        }

        const rawData = await CplUmum.findAll({
            where: whereClause,
            order: [['kode', 'ASC']]
        });

        dataCpl = rawData.map(item => ({
            id: item.id,
            kode: item.kode,
            deskripsiInd: item.deskripsiInd || '', 
            deskripsiEng: item.deskripsiEng || '', 
            targetCpl: parseFloat(item.targetCpl || 0),
            kategori: item.kategori || '-',
            tingkatCpl: item.tingkatCpl || '-'
        }));
    }

    return { header: headerInfo, tabel: dataCpl };
};

export const upsertCplUmum = async (tahunKurikulumId, payload) => {
    const { CplUmum } = models;

    const dataToSave = {
        siakTahunKurikulumId: tahunKurikulumId, 
        kode: payload.kode,
        deskripsiInd: payload.deskripsiInd, 
        deskripsiEng: payload.deskripsiEng,
        targetCpl: parseFloat(payload.targetCpl) || 0,
        kategori: payload.kategori,
        tingkatCpl: payload.tingkatCpl
    };

    if (payload.id) {
        const existingData = await CplUmum.findByPk(payload.id);
        if (!existingData) {
            throw new CustomError.NotFoundError("Data CPL Umum tidak ditemukan"); // 👈 Pakai Custom Error
        }
        return await existingData.update(dataToSave);
    } else {
        return await CplUmum.create(dataToSave);
    }
};

export const destroyCplUmum = async (id) => {
    const { CplUmum } = models;
    const existingData = await CplUmum.findByPk(id);
    if (!existingData) {
        throw new CustomError.NotFoundError("Data CPL Umum tidak ditemukan"); // 👈 Pakai Custom Error
    }
    return await existingData.destroy(); 
};