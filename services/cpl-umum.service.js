
import models from '../models/index.js';
import * as CustomError from '../utils/custom-error.js'; // 👈 Import Custom Error

const NAMA_UNIVERSITAS = 'Universitas Ibn Khaldun';

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
            include: [{ model: models.Fakultas, as: 'fakultas', attributes: ['id', 'nama'] }],
            order: [['kode', 'ASC']]
        });

        dataCpl = rawData.map(item => ({
            id: item.id,
            kode: item.kode,
            deskripsiInd: item.deskripsiInd || '',
            deskripsiEng: item.deskripsiEng || '',
            targetCpl: parseFloat(item.targetCpl || 0),
            kategori: item.kategori || '-',
            siakFakultasId: item.siakFakultasId || null,
            tingkatCpl: item.fakultas ? item.fakultas.nama : NAMA_UNIVERSITAS
        }));
    }

    return { header: headerInfo, tabel: dataCpl };
};

// Daftar opsi untuk dropdown "Tingkat CPL": Universitas (siakFakultasId: null)
// + seluruh Fakultas yang ada di master data.
export const getOpsiTingkatCpl = async () => {
    const { Fakultas } = models;
    const fakultasList = await Fakultas.findAll({
        attributes: ['id', 'nama'],
        order: [['nama', 'ASC']]
    });

    return [
        { id: null, nama: NAMA_UNIVERSITAS },
        ...fakultasList.map(f => ({ id: f.id, nama: f.nama }))
    ];
};

export const upsertCplUmum = async (tahunKurikulumId, payload) => {
    const { CplUmum, Fakultas, Sequelize } = models;

    // Kode CPL tidak boleh duplikat dengan CPL Umum lain di Tahun Kurikulum
    // yang sama (sesuai aturan SEVIMA: "tidak boleh duplikat dengan kode CPL
    // yang lain").
    const duplikatKode = await CplUmum.findOne({
        where: {
            siakTahunKurikulumId: tahunKurikulumId,
            kode: { [Sequelize.Op.iLike]: payload.kode },
            ...(payload.id ? { id: { [Sequelize.Op.ne]: payload.id } } : {})
        }
    });
    if (duplikatKode) {
        throw new CustomError.BadRequestError(`Kode CPL "${payload.kode}" sudah digunakan pada Tahun Kurikulum ini`);
    }

    // siakFakultasId null/kosong = berlaku tingkat Universitas.
    // Kalau diisi, harus merujuk ke Fakultas yang benar-benar ada.
    let siakFakultasId = payload.siakFakultasId || null;
    let namaTingkat = NAMA_UNIVERSITAS;
    if (siakFakultasId) {
        const fakultas = await Fakultas.findByPk(siakFakultasId);
        if (!fakultas) {
            throw new CustomError.NotFoundError("Fakultas yang dipilih untuk Tingkat CPL tidak ditemukan");
        }
        namaTingkat = fakultas.nama;
    }

    const dataToSave = {
        siakTahunKurikulumId: tahunKurikulumId,
        kode: payload.kode,
        deskripsiInd: payload.deskripsiInd,
        deskripsiEng: payload.deskripsiEng,
        targetCpl: parseFloat(payload.targetCpl) || 0,
        kategori: payload.kategori,
        siakFakultasId,
        tingkatCpl: namaTingkat
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