import models from '../models/index.js';
import * as CustomError from "../utils/custom-error.js";
import { getPagination, getPagingData } from "../utils/pagination.js";

const { TahunKurikulum, MataKuliah, ProgramStudi } = models;

// --- 1. REKAP DISTRIBUSI SKS (Menampilkan Tabel Daftar Kurikulum) ---
// export const getRekapDistribusiSks = async (filters) => {
//     const { prodiId, tahunKurikulumId } = filters;

//     // 1. Ambil Data Prodi & Bypass Jenjang (Untuk mengisi kolom tabel FE)
//     const prodi = await ProgramStudi.findByPk(prodiId);
//     if (!prodi) throw new Error("Program Studi tidak ditemukan");

//     let namaJenjang = 'S1'; // Default
//     if (prodi.siakJenjangId) {
//         // Asumsi model Jenjang sudah diimport di atas (models.Jenjang)
//         const jenjang = await models.Jenjang.findByPk(prodi.siakJenjangId);
//         if (jenjang) namaJenjang = jenjang.jenjang;
//     }
    
//     const namaProdiLengkap = `${namaJenjang} - ${prodi.nama}`;
//     const kodeProdi = prodi.kode;

//     // 2. Siapkan Filter Tahun Kurikulum (Jika Dropdown dipilih)
//     const kurikulumWhereClause = {};
//     if (tahunKurikulumId) {
//         kurikulumWhereClause.id = tahunKurikulumId;
//     }

//     const listTahunKurikulum = await TahunKurikulum.findAll({
//         where: kurikulumWhereClause,
//         order: [['tahun', 'DESC']]
//     });

//     // 3. Looping untuk menghitung SKS per Kurikulum
//     const result = await Promise.all(listTahunKurikulum.map(async (kurikulum) => {
//         const daftarMk = await MataKuliah.findAll({
//             where: {
//                 siakProgramStudiId: prodiId,
//                 siakTahunKurikulumId: kurikulum.id
//             },
//             attributes: ['id', 'opsiWajib', 'totalSks'] 
//         });

//         let sksWajib = 0;
//         let sksPilihan = 0;

//         daftarMk.forEach(mk => {
//             const jumlahSks = parseInt(mk.totalSks) || 0;
//             if (mk.opsiWajib === true) {
//                 sksWajib += jumlahSks;
//             } else {
//                 sksPilihan += jumlahSks;
//             }
//         });

//         return {
//             tahunKurikulumId: kurikulum.id,
//             tahun: kurikulum.tahun,
//             kodeProdi: kodeProdi,              // 👇 DATA BARU UNTUK UI
//             programStudi: namaProdiLengkap,    // 👇 DATA BARU UNTUK UI (S1 - Teknik Informatika)
//             sksWajib: sksWajib,
//             sksPilihan: sksPilihan,
//             totalSks: sksWajib + sksPilihan
//         };
//     }));

//     return result;
// };
export const getRekapDistribusiSks = async (filters) => {
    const { jenjangId, prodiId, tahunKurikulumId, page, limit } = filters;

    // 1. Filter Program Studi secara Dinamis
    const prodiWhere = {};
    if (prodiId) prodiWhere.id = prodiId;
    if (jenjangId) prodiWhere.siakJenjangId = jenjangId;

    const listProdi = await ProgramStudi.findAll({ where: prodiWhere });
    
    const pagination = getPagination(page, limit);

    // Kalau Prodi gak ada yang cocok sama filter, langsung return kosong pake getPagingData
    if (listProdi.length === 0) {
        return getPagingData({ count: 0, rows: [] }, page, pagination.limit);
    }

    // 2. Pagination Kurikulum
    const kurikulumWhere = {};
    if (tahunKurikulumId) kurikulumWhere.id = tahunKurikulumId;

    const listTahunKurikulum = await TahunKurikulum.findAndCountAll({
        where: kurikulumWhere,
        order: [['tahun', 'DESC']],
        limit: pagination.limit,
        offset: pagination.offset
    });

    // 3. Looping kombinasi Kurikulum dan Prodi (Matriks Data)
    const resultData = [];

    for (const kurikulum of listTahunKurikulum.rows) {
        for (const prodi of listProdi) {
            // Tarik nama Jenjang
            let namaJenjang = 'S1';
            if (prodi.siakJenjangId) {
                const jenjang = await models.Jenjang.findByPk(prodi.siakJenjangId);
                if (jenjang) namaJenjang = jenjang.jenjang;
            }

            // Hitung SKS untuk kombinasi Kurikulum + Prodi ini
            const daftarMk = await MataKuliah.findAll({
                where: {
                    siakProgramStudiId: prodi.id,
                    siakTahunKurikulumId: kurikulum.id
                },
                attributes: ['id', 'opsiWajib', 'totalSks'] 
            });

            // Tetap dimasukkan ke tabel walau belum ada MK -- tampil 0/0/0,
            // bukan disembunyikan, supaya prodi yang belum input kurikulum
            // tetap kelihatan di rekap.
            let sksWajib = 0;
            let sksPilihan = 0;

            daftarMk.forEach(mk => {
                const jumlahSks = parseInt(mk.totalSks) || 0;
                if (mk.opsiWajib === true) {
                    sksWajib += jumlahSks;
                } else {
                    sksPilihan += jumlahSks;
                }
            });

            resultData.push({
                tahunKurikulumId: kurikulum.id,
                tahun: kurikulum.tahun,
                kodeProdi: prodi.kode,
                programStudi: `${namaJenjang} - ${prodi.nama}`,
                sksWajib: sksWajib,
                sksPilihan: sksPilihan,
                totalSks: sksWajib + sksPilihan
            });
        }
    }

    // Urut: tahun kurikulum terbaru dulu, lalu di dalam tahun yang sama
    // prodi yang SUDAH ada datanya (totalSks > 0) ditaruh paling atas.
    resultData.sort((a, b) => {
        if (a.tahun !== b.tahun) return b.tahun.localeCompare(a.tahun);
        const aAdaData = a.totalSks > 0 ? 0 : 1;
        const bAdaData = b.totalSks > 0 ? 0 : 1;
        if (aAdaData !== bAdaData) return aAdaData - bAdaData;
        return a.kodeProdi.localeCompare(b.kodeProdi);
    });

    // 👇 4. BUNGKUS DENGAN getPagingData DARI UTILS ABANG 👇
    const resultForUtils = {
        count: listTahunKurikulum.count,
        rows: resultData
    };

    return getPagingData(resultForUtils, page, pagination.limit);
};
// --- 2. DAFTAR MATA KULIAH PER SEMESTER (Untuk Tabel Semester 1 - 8) ---
export const getMataKuliahPerSemester = async (prodiId, tahunKurikulumId) => {
    // 1. AMBIL DATA HEADER (Prodi & Kurikulum)
    const prodi = await ProgramStudi.findByPk(prodiId);
    if (!prodi) throw new CustomError.NotFoundError("Program Studi tidak ditemukan");

    let namaJenjang = 'S1';
    if (prodi.siakJenjangId) {
        const jenjang = await models.Jenjang.findByPk(prodi.siakJenjangId);
        if (jenjang) namaJenjang = jenjang.jenjang;
    }

    const kurikulum = await TahunKurikulum.findByPk(tahunKurikulumId);
    if (!kurikulum) throw new CustomError.NotFoundError("Tahun Kurikulum tidak ditemukan");

    // 2. AMBIL DATA MATA KULIAH (Tanpa Pagination)
    const listMk = await MataKuliah.findAll({
        where: { siakProgramStudiId: prodiId, siakTahunKurikulumId: tahunKurikulumId },
        attributes: ['id', 'kode', 'nama', 'totalSks', 'opsiWajib', 'nilaiMin', 'semester', 'adaPraktikum'],
        include: [
            { model: MataKuliah, as: 'prasyarat1', attributes: ['kode'] },
            { model: MataKuliah, as: 'prasyarat2', attributes: ['kode'] },
            { model: MataKuliah, as: 'prasyarat3', attributes: ['kode'] }
        ],
        order: [['semester', 'ASC'], ['kode', 'ASC']]
    });

    const courses = listMk.map(mk => {
        const prasyaratArr = [];
        if (mk.prasyarat1) prasyaratArr.push(mk.prasyarat1.kode);
        if (mk.prasyarat2) prasyaratArr.push(mk.prasyarat2.kode);
        if (mk.prasyarat3) prasyaratArr.push(mk.prasyarat3.kode);

        return {
            id: mk.id, 
            kode: mk.kode, 
            nama: mk.nama, 
            totalSks: mk.totalSks,
            opsiWajib: mk.opsiWajib, 
            statusMk: mk.opsiWajib ? 'Wajib' : 'Pilihan',
            nilaiMin: mk.nilaiMin || '-', 
            semester: mk.semester,
            adaPraktikum: mk.adaPraktikum,
            prasyarat: prasyaratArr.length > 0 ? prasyaratArr.join(', ') : '-',
            konsentrasi: '-'
        };
    });

    // 3. KELOMPOKKAN PER SEMESTER (Semester 1 - 8)
    const groupedData = Array.from({ length: 8 }, (_, i) => ({
        semester: i + 1,
        totalSksSemester: 0,
        mataKuliah: []
    }));

    const belumTerjadwal = { semester: "Belum Terjadwal", totalSksSemester: 0, mataKuliah: [] };

    courses.forEach(course => {
        if (course.semester) {
            const semIndex = course.semester - 1; 
            if (!groupedData[semIndex]) {
                groupedData[semIndex] = { semester: course.semester, totalSksSemester: 0, mataKuliah: [] };
            }
            groupedData[semIndex].totalSksSemester += (course.totalSks || 0);
            groupedData[semIndex].mataKuliah.push(course);
        } else {
            belumTerjadwal.totalSksSemester += (course.totalSks || 0);
            belumTerjadwal.mataKuliah.push(course);
        }
    });

    if (belumTerjadwal.mataKuliah.length > 0) {
        groupedData.push(belumTerjadwal);
    }

    // 4. RETURN GABUNGAN HEADER DAN SEMESTER DATA
    return {
        header: {
            kodeProdi: prodi.kode,
            programStudi: `${namaJenjang} - ${prodi.nama}`,
            tahunKurikulum: kurikulum.tahun
        },
        semesterData: groupedData
    };
};
// --- 3. DETAIL MATA KULIAH BESERTA PRASYARAT (Halaman Detail) ---
export const getDetailMataKuliah = async (mataKuliahId) => {
    const mk = await MataKuliah.findByPk(mataKuliahId, {
        include: [
            { model: ProgramStudi, as: 'programStudi', attributes: ['nama', 'siakJenjangId'] },
            { model: TahunKurikulum, as: 'tahunKurikulum', attributes: ['tahun'] },
            { model: MataKuliah, as: 'prasyarat1', attributes: ['id', 'kode', 'nama', 'totalSks', 'semester', 'nilaiMin'] },
            { model: MataKuliah, as: 'prasyarat2', attributes: ['id', 'kode', 'nama', 'totalSks', 'semester', 'nilaiMin'] },
            { model: MataKuliah, as: 'prasyarat3', attributes: ['id', 'kode', 'nama', 'totalSks', 'semester', 'nilaiMin'] },
            // 👇 Relasi ke Konsentrasi dihidupkan
            { 
                model: models.Konsentrasi, 
                as: 'konsentrasi',
                attributes: ['id', 'kode', 'nama'],
                through: { attributes: [] } // Sembunyikan data tabel pivot di response JSON
            } 
        ]
    });

    if (!mk) throw new CustomError.NotFoundError("Mata Kuliah tidak ditemukan");

    let namaJenjang = 'S1';
    if (mk.programStudi?.siakJenjangId) {
        const jenjang = await models.Jenjang.findByPk(mk.programStudi.siakJenjangId);
        if (jenjang) namaJenjang = jenjang.jenjang;
    }

    const prasyaratList = [];
    if (mk.prasyarat1) prasyaratList.push({ ...mk.prasyarat1.toJSON(), jenisSyarat: 'Sudah Lulus' });
    if (mk.prasyarat2) prasyaratList.push({ ...mk.prasyarat2.toJSON(), jenisSyarat: 'Sudah Lulus' });
    if (mk.prasyarat3) prasyaratList.push({ ...mk.prasyarat3.toJSON(), jenisSyarat: 'Sudah Lulus' });

    // 👇 Mapping data Konsentrasi agar formatnya sesuai UI Tabel (punya label 'konsentrasi')
    const konsentrasiList = mk.konsentrasi ? mk.konsentrasi.map(k => ({
        id: k.id,
        kode: k.kode || '-',
        konsentrasi: k.nama // UI biasanya butuh key ini untuk nampilin nama konsentrasinya
    })) : [];

    return {
        header: {
            programStudi: `${namaJenjang} - ${mk.programStudi?.nama || '-'}`,
            tahunKurikulum: mk.tahunKurikulum?.tahun || '-',
            sksMataKuliah: `${mk.totalSks} SKS`,
            kodeMataKuliah: mk.kode,
            namaMataKuliah: mk.nama
        },
        detail: {
            semester: mk.semester || '-',
            nilaiMinimal: mk.nilaiMin || '-',
            statusMataKuliah: mk.opsiWajib ? 'Wajib' : 'Pilihan',
            mataKuliahPaket: mk.isPaket ? 'Ya' : 'Tidak',
    topik: mk.topik || '',
    kompetensiDasar: mk.kompetensiDasar || '',
    sksMinimal: mk.sksMinimal || '0'
        },
        prasyaratMataKuliah: prasyaratList,
        konsentrasiMataKuliah: konsentrasiList // 👈 Sekarang ini akan terisi!
    };
};

// --- 4. CREATE (ASSIGN): Set Semester & Atribut MK ---
export const assignMataKuliah = async (mataKuliahId, payload) => {
    const mk = await MataKuliah.findByPk(mataKuliahId);
    if (!mk) throw new Error("Mata Kuliah tidak ditemukan di database!");

    const isWajib = payload.statusMk === 'Wajib';

    await mk.update({
        semester: payload.semester,
        nilaiMin: payload.nilaiMin || 'D',
        opsiWajib: isWajib,
        isPaket: payload.mkPaket === true
    });

    return mk;
};

// export const updateMataKuliahKurikulum = async (id, payload) => {
//     const trx = await models.sequelize.transaction();
//     try {
//         const mk = await MataKuliah.findByPk(id, { transaction: trx });
//         if (!mk) throw new Error("Mata Kuliah tidak ditemukan!");

//         // Update HANYA kolom yang kelihatan di screenshot DBeaver Abang
//         await mk.update({
//             semester: payload.semester,
//             nilaiMin: payload.nilaiMinimal,
//             opsiWajib: payload.statusMataKuliah === 'Wajib',
            
//             // Simpan ID prasyaratnya saja (maksimal 3 sesuai kolom di DB)
//             prasyarat_mata_kuliah_1: payload.prasyaratData?.[0]?.mataKuliahId || null,
//             prasyarat_mata_kuliah_2: payload.prasyaratData?.[1]?.mataKuliahId || null,
//             prasyarat_mata_kuliah_3: payload.prasyaratData?.[2]?.mataKuliahId || null,
//         }, { transaction: trx });

//         // Fitur simpan Konsentrasi KITA MATIKAN sementara sampai tabel pivotnya dibuat
//         // Fitur simpan Topik, MK Paket, dll juga kita abaikan agar tidak error

//         await trx.commit();
//         return await getDetailMataKuliah(id);
//     } catch (error) {
//         await trx.rollback();
//         throw new Error("Gagal mengupdate Mata Kuliah: " + error.message);
//     }
// };
// // --- 6. DELETE: Hapus Data MK ---
// export const removeMataKuliah = async (id) => {
//     const mk = await MataKuliah.findByPk(id);
//     if (!mk) throw new Error("Mata Kuliah tidak ditemukan!");

//     // Menghapus data MK secara permanen dari database
//     await mk.destroy(); 
//     return true;
// };

export const updateMataKuliahKurikulum = async (id, payload) => {
    const trx = await models.sequelize.transaction();
    try {
        const mk = await MataKuliah.findByPk(id, { transaction: trx });
        if (!mk) throw new CustomError.NotFoundError("Mata Kuliah tidak ditemukan!");

        // A. UPDATE TABEL UTAMA + PRASYARAT
        await mk.update({
            semester: payload.semester,
            nilaiMin: payload.nilaiMinimal,
            opsiWajib: payload.statusMataKuliah === 'Wajib',
            topik: payload.topik,
    kompetensiDasar: payload.kompetensiDasar,
    sksMinimal: payload.sksMinimal || 0,
    isPaket: payload.mataKuliahPaket === "Ya", // Mapping dari string UI ke boolean DB
            
            prasyarat_mata_kuliah_1: payload.prasyaratData?.[0]?.mataKuliahId || null,
            prasyarat_mata_kuliah_2: payload.prasyaratData?.[1]?.mataKuliahId || null,
            prasyarat_mata_kuliah_3: payload.prasyaratData?.[2]?.mataKuliahId || null,
        }, { transaction: trx });

        // B. UPDATE TABEL PIVOT KONSENTRASI
        const PivotModel = models.PemetaanKonsentrasiMk; 

        // 👇 Perhatikan sekarang kita mengecek payload.konsentrasiIds
        if (payload.konsentrasiIds && Array.isArray(payload.konsentrasiIds) && PivotModel) {
            
            // 1. Bersihkan konsentrasi lama
            await PivotModel.destroy({ 
                where: { siakMataKuliahId: id }, 
                transaction: trx 
            });

            // 2. Insert konsentrasi baru (Looping dari array string UUID)
            if (payload.konsentrasiIds.length > 0) {
                const pivotData = payload.konsentrasiIds.map(konsentrasiId => ({
                    siakMataKuliahId: id,
                    siakKonsentrasiId: konsentrasiId 
                }));
                
                await PivotModel.bulkCreate(pivotData, { transaction: trx });
            }
        }

        await trx.commit();
        
        // Return getDetail agar Frontend langsung dapat data terbaru (termasuk konsentrasi)
        return await getDetailMataKuliah(id);
    } catch (error) {
        await trx.rollback();
        if (error.statusCode) throw error; 
        throw new CustomError.InternalServerError("Gagal mengupdate Mata Kuliah: " + error.message);
    }
};

export const removeMataKuliah = async (id) => {
    const mk = await MataKuliah.findByPk(id);
    if (!mk) throw new CustomError.NotFoundError("Mata Kuliah tidak ditemukan!");
    await mk.destroy(); 
    return true;
};
// --- 7. GET DROPDOWN PRASYARAT (Menarik semua MK untuk Dropdown Prasyarat) ---
export const getDropdownPrasyarat = async (prodiId, tahunKurikulumId) => {
    const listMk = await MataKuliah.findAll({
        where: {
            siakProgramStudiId: prodiId,
            siakTahunKurikulumId: tahunKurikulumId
        },
        // Ambil data seperlunya saja biar enteng saat dirender di Dropdown
        attributes: ['id', 'kode', 'nama', 'totalSks', 'semester'],
        order: [['semester', 'ASC'], ['kode', 'ASC']]
    });

    // Format outputnya biar Frontend tinggal melahapnya ke dalam elemen <select> atau Dropdown
    return listMk.map(mk => ({
        id: mk.id,
        label: `${mk.kode} - ${mk.nama} (${mk.totalSks} SKS - SEMESTER ${mk.semester || '-'})`
    }));
};

// --- 8. GET DROPDOWN KONSENTRASI ---
export const getDropdownKonsentrasi = async (prodiId) => {
    // Gunakan model Konsentrasi sesuai tabel siak_konsentrasi
    const { Konsentrasi } = models; 

    const listKonsentrasi = await Konsentrasi.findAll({
        where: { siakProgramStudiId: prodiId }, // Filter jitu biar konsentrasi nggak nyasar ke prodi lain
        attributes: ['id', 'kode', 'nama'], 
        order: [['nama', 'ASC']]
    });

    return listKonsentrasi.map(k => ({
        id: k.id,
        // Tampilkan "Kode - Nama" di Dropdown jika kodenya ada
        label: k.kode ? `${k.kode} - ${k.nama}` : k.nama
    }));
};