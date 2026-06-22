// import models from '../models/index.js';

// const { PredikatKelulusan, ProgramStudi, TahunKurikulum, Jenjang, sequelize } = models;

// // --- FUNGSI LAMA ABANG (TETAP PERTAHANKAN) ---
// export const getPredikatKelulusan = async (tahunKurikulumId, jenjangId) => {
//     return await PredikatKelulusan.findAll({
//         where: {
//             siak_tahun_kurikulum_id: tahunKurikulumId,
//             siak_jenjang_id: jenjangId
//         },
//         order: [['ipk_min', 'DESC']]
//     });
// };

// // --- FUNGSI BARU UNTUK UI SEVIMA (DENGAN HEADER) ---
// export const getPredikatWithHeader = async (prodiId, tahunKurikulumId) => {
//     // 1. Ambil info Prodi untuk Header + Jenjang
//     const prodi = await ProgramStudi.findByPk(prodiId, {
//         attributes: ['kode', 'nama', 'siakJenjangId'] // Atau siak_jenjang_id, sesuaikan model Abang
//     });

//     const kurikulum = await TahunKurikulum.findByPk(tahunKurikulumId, {
//         attributes: ['tahun']
//     });

//     let namaJenjang = 'S1';
//     // Ambil string jenjang dari tabel Jenjang
//     if (prodi && prodi.siakJenjangId) {
//         const jenjang = await Jenjang.findByPk(prodi.siakJenjangId);
//         if (jenjang) namaJenjang = jenjang.jenjang;
//     }

//     const headerInfo = {
//         kodeProdi: prodi?.kode || '-',
//         programStudi: `${namaJenjang} - ${prodi?.nama || '-'}`,
//         tahunKurikulum: kurikulum?.tahun || '-'
//     };

//     // 2. Ambil data predikat
//     const list = await PredikatKelulusan.findAll({
//         where: {
//             siakTahunKurikulumId: tahunKurikulumId, // Sesuai nama key Sequelize
//             siakJenjangId: prodi?.siakJenjangId 
//         },
//         order: [['ipkMin', 'DESC']] // Urutkan dari IPK 4.00 ke bawah
//     });

//     // 3. Mapping Data biar JSON-nya bersih dan persis dengan UI
//     const formattedList = list.map(item => ({
//         id: item.id,
//         kode: item.kode,
//         nama: item.namaInd || '-',      // Frontend butuhnya 'nama'
//         namaEn: item.namaEng || '-',    // Frontend butuhnya 'namaEn'
//         ipkMin: parseFloat(item.ipkMin) || 0,
//         ipkMax: parseFloat(item.ipkMax) || 0,
//         masaStudi: parseInt(item.masaStudi) || 0
//     }));

//     return {
//         header: headerInfo,
//         tabel: formattedList
//     };
// };
// // --- FUNGSI BARU: UPSERT BULK (WIPE & REPLACE) ---
// // ========================================================================
// // 2. UPSERT BULK (WIPE & REPLACE) DENGAN RETURN YANG BERSIH
// // ========================================================================
// export const upsertBulkPredikat = async (payload) => {
//     const { tahunKurikulumId, jenjangId, dataPredikat } = payload;
//     const transaction = await sequelize.transaction();

//     try {
//         // 1. Hapus data lama untuk kurikulum & jenjang ini
//         await PredikatKelulusan.destroy({
//             where: {
//                 siakTahunKurikulumId: tahunKurikulumId, 
//                 siakJenjangId: jenjangId                
//             },
//             transaction
//         });

//         // 2. Mapping data dari UI ke KEY SEQUELIZE
//         const dataToInsert = dataPredikat.map(item => ({
//             siakTahunKurikulumId: tahunKurikulumId,
//             siakJenjangId: jenjangId,
//             kode: item.kode,
//             namaInd: item.nama,        
//             namaEng: item.namaEn,      
//             ipkMin: parseFloat(item.ipkMin) || 0,
//             ipkMax: parseFloat(item.ipkMax) || 0,
//             masaStudi: parseInt(item.masaStudi) || 0
//         }));

//         // 3. Simpan Massal
//         const result = await PredikatKelulusan.bulkCreate(dataToInsert, { transaction });
        
//         await transaction.commit();

//         // 4. MAPPING RETURN AGAR BERSIH DAN SESUAI DENGAN UI
//         const formattedResult = result.map(item => ({
//             id: item.id,
//             kode: item.kode,
//             nama: item.namaInd,
//             namaEn: item.namaEng,
//             ipkMin: parseFloat(item.ipkMin),
//             ipkMax: parseFloat(item.ipkMax),
//             masaStudi: parseInt(item.masaStudi)
//         }));

//         return formattedResult;

//     } catch (error) {
//         await transaction.rollback();
//         throw new Error(`Gagal bulk save: ${error.message}`);
//     }
// };
// export const createPredikatKelulusan = async (payload) => {
//     const { PredikatKelulusan } = models;
//     return await PredikatKelulusan.create(payload);
// };

// export const updatePredikatKelulusan = async (id, payload) => {
//     const { PredikatKelulusan } = models;
    
//     const existingData = await PredikatKelulusan.findByPk(id);
//     if (!existingData) {
//         throw new Error("Data Predikat Kelulusan tidak ditemukan");
//     }

//     const [updatedRowsCount] = await PredikatKelulusan.update(payload, {
//         where: { id: id }
//     });

//     return updatedRowsCount > 0;
// };

// export const deletePredikatKelulusan = async (id) => {
//     const { PredikatKelulusan } = models;
    
//     const deletedRowsCount = await PredikatKelulusan.destroy({
//         where: { id: id }
//     });

//     return deletedRowsCount > 0;
// };
// import models from '../models/index.js';
// import * as CustomError from "../utils/custom-error.js";

// const { PredikatKelulusan, ProgramStudi, TahunKurikulum, Jenjang, sequelize } = models;

// /**
//  * Mendapatkan data Predikat beserta info Header untuk UI Kurikulum Prodi
//  */
// export const getPredikatWithHeader = async (prodiId, tahunKurikulumId) => {
//     // 1. Ambil data pendukung untuk Header
//     const prodi = await ProgramStudi.findByPk(prodiId, {
//         attributes: ['id', 'kode', 'nama', 'siakJenjangId']
//     });

//     const kurikulum = await TahunKurikulum.findByPk(tahunKurikulumId, {
//         attributes: ['id', 'tahun']
//     });

//     if (!prodi || !kurikulum) {
//         throw new CustomError.NotFoundError("Program Studi atau Tahun Kurikulum tidak ditemukan");
//     }

//     // 2. Ambil label Nama Jenjang (S1, D3, dll)
//     let namaJenjang = 'S1';
//     if (prodi.siakJenjangId) {
//         const jenjang = await Jenjang.findByPk(prodi.siakJenjangId);
//         if (jenjang) namaJenjang = jenjang.jenjang;
//     }

//     // 3. Ambil List Predikat berdasarkan Jenjang & Kurikulum
//     const list = await PredikatKelulusan.findAll({
//         where: {
//             siakTahunKurikulumId: tahunKurikulumId,
//             siakJenjangId: prodi.siakJenjangId 
//         },
//         order: [['ipkMin', 'DESC']]
//     });

//     // 4. Return format sesuai kebutuhan UI
//     return {
//         header: {
//             kodeProdi: prodi.kode || '-',
//             programStudi: `${namaJenjang} - ${prodi.nama || '-'}`,
//             tahunKurikulum: kurikulum.tahun || '-'
//         },
//         tabel: list.map(item => ({
//             id: item.id,
//             kode: item.kode,
//             nama: item.namaInd,   // Mapping ke key 'nama' di UI
//             namaEn: item.namaEng, // Mapping ke key 'namaEn' di UI
//             ipkMin: parseFloat(item.ipkMin) || 0,
//             ipkMax: parseFloat(item.ipkMax) || 0,
//             masaStudi: parseInt(item.masaStudi) || 0
//         }))
//     };
// };

// /**
//  * Simpan massal dengan sistem Hapus Lama -> Masukkan Baru (Wipe & Replace)
//  */
// export const upsertBulkPredikat = async (payload) => {
//     const { tahunKurikulumId, jenjangId, dataPredikat } = payload;
    
//     // Gunakan Transaksi agar jika satu gagal, semua dibatalkan
//     const trx = await sequelize.transaction();

//     try {
//         // 1. Hapus data lama (Clean up)
//         await PredikatKelulusan.destroy({
//             where: {
//                 siakTahunKurikulumId: tahunKurikulumId,
//                 siakJenjangId: jenjangId
//             },
//             transaction: trx
//         });

//         // 2. Mapping data dari format UI ke format Database Sequelize
//         const dataToInsert = dataPredikat.map(item => ({
//             siakTahunKurikulumId: tahunKurikulumId,
//             siakJenjangId: jenjangId,
//             kode: item.kode,
//             namaInd: item.nama,   // Dari 'nama' ke 'namaInd'
//             namaEng: item.namaEn, // Dari 'namaEn' ke 'namaEng'
//             ipkMin: parseFloat(item.ipkMin),
//             ipkMax: parseFloat(item.ipkMax),
//             masaStudi: parseInt(item.masaStudi)
//         }));

//         // 3. Insert massal data baru
//         const result = await PredikatKelulusan.bulkCreate(dataToInsert, { transaction: trx });
        
//         await trx.commit();

//         // 4. Return data yang baru saja disimpan dengan format bersih
//         return result.map(item => ({
//             id: item.id,
//             kode: item.kode,
//             nama: item.namaInd,
//             namaEn: item.namaEng,
//             ipkMin: parseFloat(item.ipkMin),
//             ipkMax: parseFloat(item.ipkMax),
//             masaStudi: item.masaStudi
//         }));

//     } catch (error) {
//         await trx.rollback();
//         throw new CustomError.InternalServerError("Gagal menyimpan data predikat secara massal: " + error.message);
//     }
// };

// /**
//  * Fungsi CRUD Standar (Individu)
//  */
// export const getPredikatKelulusan = async (tahunKurikulumId, jenjangId) => {
//     return await PredikatKelulusan.findAll({
//         where: { siakTahunKurikulumId: tahunKurikulumId, siakJenjangId: jenjangId },
//         order: [['ipkMin', 'DESC']]
//     });
// };

// export const createPredikatKelulusan = async (payload) => {
//     return await PredikatKelulusan.create(payload);
// };

// export const updatePredikatKelulusan = async (id, payload) => {
//     const data = await PredikatKelulusan.findByPk(id);
//     if (!data) throw new CustomError.NotFoundError("Data predikat tidak ditemukan");
//     return await data.update(payload);
// };

// export const deletePredikatKelulusan = async (id) => {
//     const data = await PredikatKelulusan.findByPk(id);
//     if (!data) throw new CustomError.NotFoundError("Data predikat tidak ditemukan");
//     return await data.destroy();
// };
import models from '../models/index.js';
import * as CustomError from "../utils/custom-error.js";

const { PredikatKelulusan, ProgramStudi, TahunKurikulum, PeriodeAkademik } = models;

const formatIndoDate = (dateString) => {
    if (!dateString) return '-';
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(dateString));
};

export const getPredikatWithHeader = async (params) => {
    const { tahunKurikulumId, jenjangId, prodiId } = params;
    
    const kurikulum = await TahunKurikulum.findByPk(tahunKurikulumId, {
        include: [{ model: PeriodeAkademik, as: 'periodeAkademik' }]
    });

    if (!kurikulum) throw new CustomError.NotFoundError("Kurikulum tidak ditemukan");

    let headerLengkap = {
        kurikulum: kurikulum.tahun,
        mulaiBerlaku: kurikulum.periodeAkademik?.nama || '-',
        tanggalAwal: formatIndoDate(kurikulum.tanggalMulai),
        tanggalAkhir: formatIndoDate(kurikulum.tanggalSelesai),
    };

    let whereClause = { siakTahunKurikulumId: tahunKurikulumId };
    if (prodiId) {
        const prodi = await ProgramStudi.findByPk(prodiId);
        headerLengkap.programStudi = prodi?.nama;
        whereClause.siakJenjangId = prodi?.siakJenjangId;
    } else if (jenjangId) {
        whereClause.siakJenjangId = jenjangId;
    }

    const list = await PredikatKelulusan.findAll({
        where: whereClause,
        order: [['ipkMin', 'DESC']]
    });

    return {
        header: headerLengkap,
        tabel: list.map(item => ({
            id: item.id,
            kode: item.kode,
            nama: item.namaInd || '-',
            namaEn: item.namaEng || '-',
            ipkMin: parseFloat(item.ipkMin) || 0,
            ipkMax: parseFloat(item.ipkMax) || 0,
            masaStudi: parseInt(item.masaStudi) || 0,
            // Kolom OBE Lanjutan (untuk validasi kelulusan)
            nilaiMin: item.nilaiMin || null,       // Misal: 'C' → semua MK minimal nilai C
            nilaiMinTa: item.nilaiMinTa || null,   // Misal: 'B' → Tugas Akhir minimal B
            isCuti: item.isCuti || false,           // Berlaku untuk mahasiswa cuti
            isMengulang: item.isMengulang || false, // Berlaku untuk mahasiswa mengulang
            isMabaOnly: item.isMabaOnly || false    // Hanya berlaku untuk mahasiswa baru
        }))
    };
};

export const getPredikatById = async (id) => {
    const data = await PredikatKelulusan.findByPk(id);
    if (!data) throw new CustomError.NotFoundError("Data tidak ditemukan");
    return data;
};

export const createOrUpdate = async (payload) => {
    if (payload.id) {
        const data = await PredikatKelulusan.findByPk(payload.id);
        if (!data) throw new CustomError.NotFoundError("Data tidak ditemukan untuk diupdate");
        return await data.update(payload);
    }
    return await PredikatKelulusan.create(payload);
};

export const deletePredikatKelulusan = async (id) => {
    const data = await PredikatKelulusan.findByPk(id);
    if (!data) throw new CustomError.NotFoundError("Data tidak ditemukan");
    return await data.destroy();
};

// =========================================================
// PRATINJAU SALIN Predikat Kelulusan (lihat isi sumber sebelum disalin)
// =========================================================
export const pratinjauSalinPredikat = async (jenjangIdAsal, tahunKurikulumIdAsal) => {
    const { Jenjang } = models;

    const predikatAsal = await PredikatKelulusan.findAll({
        where: { siakJenjangId: jenjangIdAsal, siakTahunKurikulumId: tahunKurikulumIdAsal },
        order: [['ipkMin', 'DESC']]
    });
    if (predikatAsal.length === 0) throw new CustomError.NotFoundError("Predikat Kelulusan pada Jenjang & Tahun Kurikulum asal belum diisi");

    const jenjang = await Jenjang.findByPk(jenjangIdAsal, { attributes: ['jenjang'] });
    const kurikulum = await TahunKurikulum.findByPk(tahunKurikulumIdAsal, { attributes: ['tahun'] });

    return {
        jenjangAsal: jenjang?.jenjang || '-',
        tahunKurikulumAsal: kurikulum?.tahun || '-',
        predikat: predikatAsal.map(p => ({
            kode: p.kode,
            nama: p.namaInd || '-',
            namaEn: p.namaEng || '-',
            ipkMin: parseFloat(p.ipkMin || 0),
            ipkMax: parseFloat(p.ipkMax || 0),
            masaStudi: parseInt(p.masaStudi || 0),
            nilaiMin: p.nilaiMin || null,
            nilaiMinTa: p.nilaiMinTa || null,
            isCuti: p.isCuti || false,
            isMengulang: p.isMengulang || false,
            isMabaOnly: p.isMabaOnly || false
        }))
    };
};

// =========================================================
// SALIN Predikat Kelulusan (wipe & replace tujuan: jenjang + tahun kurikulum tujuan)
// =========================================================
export const salinPredikat = async (payload) => {
    const { jenjangIdAsal, tahunKurikulumIdAsal, jenjangIdTujuan, tahunKurikulumIdTujuan } = payload;

    const predikatAsal = await PredikatKelulusan.findAll({
        where: { siakJenjangId: jenjangIdAsal, siakTahunKurikulumId: tahunKurikulumIdAsal }
    });
    if (predikatAsal.length === 0) throw new CustomError.NotFoundError("Predikat Kelulusan pada Jenjang & Tahun Kurikulum asal belum diisi");

    return await models.sequelize.transaction(async (trx) => {
        await PredikatKelulusan.destroy({
            where: { siakJenjangId: jenjangIdTujuan, siakTahunKurikulumId: tahunKurikulumIdTujuan },
            force: true,
            transaction: trx
        });

        const dataBaru = predikatAsal.map(p => ({
            siakJenjangId: jenjangIdTujuan,
            siakTahunKurikulumId: tahunKurikulumIdTujuan,
            kode: p.kode,
            namaInd: p.namaInd,
            namaEng: p.namaEng,
            ipkMin: p.ipkMin,
            ipkMax: p.ipkMax,
            masaStudi: p.masaStudi,
            nilaiMin: p.nilaiMin,
            nilaiMinTa: p.nilaiMinTa,
            isCuti: p.isCuti,
            isMengulang: p.isMengulang,
            isMabaOnly: p.isMabaOnly
        }));
        await PredikatKelulusan.bulkCreate(dataBaru, { transaction: trx });

        return { jumlahDisalin: dataBaru.length };
    });
};
