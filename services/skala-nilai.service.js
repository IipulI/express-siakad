// import models from '../models/index.js';

// export const getSkalaNilaiByProdi = async (programStudiId, tahunKurikulumId) => {
//     const { SkalaPenilaian } = models;
//     return await SkalaPenilaian.findAll({
//         where: {
//             siak_program_studi_id: programStudiId,
//             siak_tahun_kurikulum_id: tahunKurikulumId
//         },
//         order: [['nilai_min', 'DESC']] // Urutkan dari nilai tertinggi (A) ke bawah
//     });
// };

// export const upsertSkalaNilai = async (payload) => {
//     const { SkalaPenilaian } = models;
    
//     // Jika ada ID, berarti Update. Jika tidak ada, Create baru.
//     if (payload.id) {
//         const existingData = await SkalaPenilaian.findByPk(payload.id);
//         if (!existingData) throw new Error("Data Skala Nilai tidak ditemukan");
//         return await existingData.update(payload);
//     } else {
//         return await SkalaPenilaian.create(payload);
//     }
// };

// export const deleteSkalaNilai = async (id) => {
//     const { SkalaPenilaian } = models;
//     const data = await SkalaPenilaian.findByPk(id);
//     if (!data) throw new Error("Data Skala Nilai tidak ditemukan");
//     return await data.destroy();
// };
// import models from '../models/index.js';

// // ========================================================================
// // 1. GET DATA SKALA NILAI (Lengkap dengan Header & Dropdown)
// // ========================================================================
// export const getSkalaNilaiByProdi = async (programStudiId, tahunKurikulumId) => {
//     // Panggil model yang dibutuhkan
//     const { SkalaPenilaian, ProgramStudi, TahunKurikulum, Jenjang, PeriodeAkademik } = models;

//     // A. AMBIL DATA HEADER
//     const prodi = await ProgramStudi.findByPk(programStudiId, { attributes: ['kode', 'nama', 'siakJenjangId'] });
//     const kurikulum = await TahunKurikulum.findByPk(tahunKurikulumId, { attributes: ['tahun'] });

//     if (!prodi || !kurikulum) throw new Error("Program Studi atau Tahun Kurikulum tidak ditemukan");

//     let namaJenjang = 'S1';
//     if (prodi.siakJenjangId) {
//         const jenjang = await Jenjang.findByPk(prodi.siakJenjangId);
//         if (jenjang) namaJenjang = jenjang.jenjang;
//     }

//     const headerInfo = {
//         kodeProdi: prodi.kode || '-',
//         programStudi: `${namaJenjang} - ${prodi.nama || '-'}`,
//         tahunKurikulum: kurikulum.tahun || '-'
//     };

//     // B. AMBIL DAFTAR PERIODE (Untuk Dropdown di UI)
//     const daftarPeriode = await PeriodeAkademik.findAll({
//         attributes: ['id', 'nama', 'status'],
//         order: [['tanggal_mulai', 'DESC']]
//     });

//     // C. AMBIL ISI TABEL SKALA NILAI
//     const listSkala = await SkalaPenilaian.findAll({
//         where: {
//             siak_program_studi_id: programStudiId,
//             siak_tahun_kurikulum_id: tahunKurikulumId
//         },
//         order: [['nilai_min', 'DESC']] // Urutkan dari nilai min tertinggi ke bawah
//     });

//     // Format Data Tabel agar sesuai dengan key dari UI Frontend
//     const formattedSkala = listSkala.map(item => ({
//         id: item.id,
//         grade: item.hurufMutu || item.huruf_mutu,
//         bobot: parseFloat(item.angkaMutu || item.angka_mutu || 0),
//         nilaiBawah: parseFloat(item.nilaiMin || item.nilai_min || 0),
//         nilaiAtas: parseFloat(item.nilaiMax || item.nilai_max || 0),
//         keterangan: item.keterangan || '-',
//         nilaiDefault: item.isDefault || item.is_default || false // Key untuk checkbox default
//     }));

//     return {
//         header: headerInfo,
//         daftarPeriode: daftarPeriode,
//         skalaNilai: formattedSkala
//     };
// };

// // ========================================================================
// // 2. UPSERT SKALA NILAI (Sistem Wipe & Replace Massal)
// // ========================================================================
// export const upsertSkalaNilai = async (payload) => {
//     const { SkalaPenilaian, sequelize } = models; 
//     const { programStudiId, tahunKurikulumId, dataSkala } = payload;

//     const transaction = await sequelize.transaction();

//     try {
//         // 1. WIPE: Hapus semua data Skala Nilai lama untuk Prodi & Kurikulum ini
//         await SkalaPenilaian.destroy({
//             where: {
//                 siak_program_studi_id: programStudiId,
//                 siak_tahun_kurikulum_id: tahunKurikulumId
//             },
//             transaction
//         });

//         // 2. MAPPING DATA BARU: Pastikan baca key dari form Frontend
//         const dataToInsert = dataSkala.map(item => ({
//             siakProgramStudiId: programStudiId,       
//             siakTahunKurikulumId: tahunKurikulumId,   
//             hurufMutu: item.grade,                    
//             angkaMutu: parseFloat(item.bobot) || 0,   
//             nilaiMin: parseFloat(item.nilaiBawah) || 0, 
//             nilaiMax: parseFloat(item.nilaiAtas) || 0,  
//             keterangan: item.keterangan || null,
//             // Cek nilaiDefault (sesuai JSON format kita di GET) atau isDefault 
//             isDefault: item.nilaiDefault || item.isDefault || false 
//         }));

//         console.log("DATA YANG MAU DI-INSERT:", dataToInsert);

//         // 3. REPLACE: Insert semua data baru secara massal
//         const createdData = await SkalaPenilaian.bulkCreate(dataToInsert, { transaction });
        
//         await transaction.commit();
//         return createdData;
//     } catch (error) {
//         await transaction.rollback();
//         throw new Error(`Gagal menyimpan data skala nilai: ${error.message}`);
//     }
// };

// // ========================================================================
// // 3. DELETE SKALA NILAI
// // ========================================================================
// export const deleteSkalaNilai = async (id) => {
//     const { SkalaPenilaian } = models;
//     const data = await SkalaPenilaian.findByPk(id);
//     if (!data) throw new Error("Data Skala Nilai tidak ditemukan");
//     return await data.destroy();
// };
import models from '../models/index.js';
import * as CustomError from '../utils/custom-error.js';

const formatIndoDate = (dateString) => {
    if (!dateString) return '-';
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(dateString));
};

export const getSkalaNilaiList = async (params) => {
    const { programStudiId, jenjangId, tahunKurikulumId, periodeId } = params;
    
    // 👇 FIX 1: Panggil model yang benar (SkalaPenilaian)
    const { TahunKurikulum, PeriodeAkademik, ProgramStudi, SkalaPenilaian } = models;

    // 1. Ambil Header Dasar (Kurikulum)
    const kurikulum = await TahunKurikulum.findByPk(tahunKurikulumId, {
        attributes: ['tahun', 'keterangan', 'tanggalMulai', 'tanggalSelesai'],
        include: [{ model: PeriodeAkademik, as: 'periodeAkademik', attributes: ['nama'] }]
    });

    if (!kurikulum) throw new CustomError.NotFoundError("Data Tahun Kurikulum tidak ditemukan");

    let headerLengkap = {
        kurikulum: kurikulum.tahun,
        keterangan: kurikulum.keterangan || '-',
        mulaiBerlaku: kurikulum.periodeAkademik ? kurikulum.periodeAkademik.nama : `${kurikulum.tahun} Ganjil`,
        tanggalAwal: formatIndoDate(kurikulum.tanggalMulai),
        tanggalAkhir: formatIndoDate(kurikulum.tanggalSelesai)
    };

    // 2. Modifikasi Header & Query Filter
    let whereClause = { siak_tahun_kurikulum_id: tahunKurikulumId };

    if (programStudiId) {
        // Mode: Kurikulum Prodi
        const prodi = await ProgramStudi.findByPk(programStudiId, { attributes: ['kode', 'nama'] });
        headerLengkap.kodeProdi = prodi ? prodi.kode : '-';
        headerLengkap.programStudi = prodi ? prodi.nama : '-';
        whereClause.siak_program_studi_id = programStudiId;
    } else if (jenjangId) {
        // Mode: Tahun Kurikulum (Header murni)
        // Note: Pastikan kolom siak_jenjang_id ada di database kalau mode ini dipakai
        whereClause.siak_jenjang_id = jenjangId;
    }

    if (periodeId) {
        whereClause.siak_periode_akademik_id = periodeId;
    }

    // 3. Ambil List Periode (Untuk Dropdown UI)
    const daftarPeriode = await PeriodeAkademik.findAll({
        attributes: ['id', 'nama', 'status'],
        order: [['nama', 'DESC']]
    });

    // 4. Ambil Data Skala Penilaian
    const listSkalaNilai = await SkalaPenilaian.findAll({
        where: whereClause,
        order: [['angkaMutu', 'DESC']] // 👈 Sort by angkaMutu, bukan bobot
    });

    // 👇 FIX 2: Mapping nama kolom DB ke format UI
    const formattedSkalaNilai = listSkalaNilai.map(item => ({
        id: item.id,
        grade: item.hurufMutu,               // hurufMutu -> grade
        bobot: parseFloat(item.angkaMutu || 0), // angkaMutu -> bobot
        nilaiBawah: parseFloat(item.nilaiMin || 0), // nilaiMin -> nilaiBawah
        nilaiAtas: parseFloat(item.nilaiMax || 0),  // nilaiMax -> nilaiAtas
        keterangan: item.keterangan || '-',
        nilaiDefault: item.isDefault || false       // isDefault -> nilaiDefault
    }));

    return {
        header: headerLengkap,
        daftarPeriode: daftarPeriode,
        skalaNilai: formattedSkalaNilai
    };
};

export const upsertSkalaNilai = async (payload) => {
    // 👇 FIX 3: Gunakan SkalaPenilaian
    const { SkalaPenilaian } = models; 
    const { tahunKurikulumId, programStudiId, jenjangId, dataSkala } = payload;
    const trx = await models.sequelize.transaction();

    try {
        // 1. Bersihkan data lama
        let whereClause = { siak_tahun_kurikulum_id: tahunKurikulumId };
        
        if (programStudiId) {
            whereClause.siak_program_studi_id = programStudiId;
        }
        
        // Wipe data lama sebelum insert baru (force: true = hard delete, bukan soft-delete)
        await SkalaPenilaian.destroy({ where: whereClause, force: true, transaction: trx });

        // 2. Insert data baru
        for (const item of dataSkala) {
            await SkalaPenilaian.create({
                siakTahunKurikulumId: tahunKurikulumId,
                siakProgramStudiId: programStudiId || null,
                
                // 👇 FIX 4: Masukkan data UI ke kolom DB yang sesuai
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