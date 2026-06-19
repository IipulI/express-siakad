// import models from "../models/index.js";
// const { MataKuliah } = models

// export const fetchKurikulumProdi = async (programStudiId, tahunKurikulumId) => {
//     try {
//         if (programStudiId === null && tahunKurikulumId === null) {
//             throw new Error(`Program studi dan tahun kurikulum wajib diisi`)
//         }

//         const rows = await MataKuliah.findAll({
//             where: {
//                 siakProgramStudiId: programStudiId,
//                 siakTahunKurikulumId: tahunKurikulumId
//             },
//             order: [
//                 ['semester', 'ASC'],
//                 ['jenis', 'ASC'],
//                 ['nama', 'ASC']
//             ]
//         })

//         return rows
//     }
//     catch (error) {
//         throw new Error(`Terjadi kesalahan saat mengambil data: ${error.message}`)
//     }
// }

// export const addCourseToKurikulumProdi = async (id, courseData) => {
//     try {
//         const existingMataKuliah = MataKuliah.findByPk(id)
//         if (!existingMataKuliah) {
//             throw new Error(`Data MataKuliah tidak ditemukan`)
//         }

//         const [updatedRowsCount] = await MataKuliah.update({
//             nilaiMin: courseData.nilaiMin,
//             semester: courseData.semester,
//             opsiWajib: courseData.opsiWajib,
//         }, {
//             where: {
//                 id: id
//             }
//         })

//         return updatedRowsCount > 0;
//     }
//     catch (error) {
//         throw new Error(`Terjadi kesalahan saat memperbarui data: ${error.message}`)
//     }
// }

// export const deleteCourseFromKurikulumProdi = async (id) => {
//     try {
//         const existingMataKuliah = MataKuliah.findByPk(id)
//         if (!existingMataKuliah) {
//             throw new Error(`Data Mata Kuliah tidak ditemukan`)
//         }

//         const [updatedRowsCount] = await MataKuliah.update({
//             nilaiMin: null,
//             semester: null,
//             opsiWajib: null
//         }, {
//             where: {
//                 id: id
//             }
//         })
//     }
//     catch (error) {
//         throw new Error(`Terjadi kesalahan saat memperbarui data: ${error.message}`)
//     }
// }
import models from '../models/index.js';
import { getPagination, getPagingData } from "../utils/pagination.js";
import * as CustomError from "../utils/custom-error.js";

const { TahunKurikulum, Obe, ProgramStudi, CapaianPembelajaranLulusan, CapaianMataKuliah, Jenjang, Sequelize } = models;
// --- GET DAFTAR PRODI ---
// export const getRekapTahunKurikulum = async () => {
//     // PeriodeAkademik kita keluarkan dari pemanggilan model agar tidak crash
//     const { TahunKurikulum, Obe, ProgramStudi } = models;

//     // 1. Hitung total seluruh Program Studi yang aktif
//     const totalProdi = await ProgramStudi.count();

//     // 2. Ambil semua data Tahun Kurikulum (TANPA INCLUDE)
//     const listKurikulum = await TahunKurikulum.findAll({
//         order: [['tahun', 'DESC']] // Urutkan dari tahun terbaru (2025 ke bawah)
//     });

//     // Fungsi kecil untuk format tanggal menjadi "1 Sep 2025"
//     const formatDate = (dateString) => {
//         if (!dateString) return '-';
//         const d = new Date(dateString);
//         const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
//         return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
//     };

//     // 3. Mapping data dan hitung jumlah OBE / Non-OBE per Kurikulum
//     const result = await Promise.all(listKurikulum.map(async (kurikulum) => {
//         // Hitung ada berapa Prodi yang pakai OBE di tahun kurikulum ini
//         const countObe = await Obe.count({
//             where: { siak_tahun_kurikulum_id: kurikulum.id } 
//         });

//         // Hitung Non-OBE (Total Prodi dikurangi yang sudah OBE)
//         let countNonObe = totalProdi - countObe;
//         if (countNonObe < 0) countNonObe = 0; 

//         // Handle kolom 'Mulai Berlaku'. 
//         // Jika kolomnya ada di tabel, ambil isinya. Jika tidak ada, pakai default (Misal: "2025 Ganjil")
//         const mulaiBerlaku = kurikulum.mulaiBerlaku || kurikulum.mulai_berlaku || `${kurikulum.tahun} Ganjil`;

//         return {
//             id: kurikulum.id,
//             tahun: kurikulum.tahun,
//             tanggalAwal: formatDate(kurikulum.tanggalMulai || kurikulum.tanggal_mulai),
//             tanggalAkhir: formatDate(kurikulum.tanggalAkhir || kurikulum.tanggal_akhir),
//             mulaiBerlaku: mulaiBerlaku,
//             keterangan: kurikulum.keterangan || '-',
//             prodiObe: countObe,
//             prodiNonObe: countNonObe
//         };
//     }));

//     return result;
// };
// // --- GET DAFTAR PRODI (DENGAN SEARCH & FILTER) ---
// export const getDaftarKurikulumProdi = async (tahunKurikulumId, jenjangId, search, jenisKurikulumFilter) => {
//     // 👇 Pastikan Sequelize di-import dari models
//     const { ProgramStudi, Obe, CapaianPembelajaranLulusan, CapaianMataKuliah, Sequelize } = models;

//     // 1. Setup kondisi pencarian untuk tabel ProgramStudi
//     const whereProdi = { siak_jenjang_id: jenjangId };
    
//     // Jika ada inputan di kotak pencarian, filter berdasarkan nama Prodi
//     if (search) {
//         whereProdi.nama = { [Sequelize.Op.iLike]: `%${search}%` };
//     }

//     const listProdi = await ProgramStudi.findAll({
//         where: whereProdi,
//         attributes: ['id', 'kode', 'nama'],
//         order: [['kode', 'ASC']]
//     });

//     // 2. Mapping data OBE seperti biasa
//     const result = await Promise.all(listProdi.map(async (prodi) => {
//         const obeData = await Obe.findOne({
//             where: {
//                 siak_program_studi_id: prodi.id,
//                 siak_tahun_kurikulum_id: tahunKurikulumId
//             },
//             attributes: ['id', 'targetCpl', 'targetCpmk'] 
//         });

//         let jumlahCpl = 0;
//         let jumlahCpmk = 0;
//         let jenisKurikulum = "Non OBE";
//         let targetCpl = 0;
//         let targetCpmk = 0;

//         if (obeData) {
//             jenisKurikulum = "OBE";
//             targetCpl = obeData.targetCpl || 0;
//             targetCpmk = obeData.targetCpmk || 0;
            
//             jumlahCpl = await CapaianPembelajaranLulusan.count({
//                 where: { siak_obe_id: obeData.id }
//             });

//             jumlahCpmk = await CapaianMataKuliah.count({
//                 where: { siak_obe_id: obeData.id }
//             });
//         }

//         return {
//             programStudiId: prodi.id,
//             kodeProdi: prodi.kode,
//             // Opsional: Jika ingin persis UI yang ada teks "S1 - " nya
//             namaProdi: prodi.nama, 
//             jenisKurikulum: jenisKurikulum,
//             targetCpl: targetCpl,     
//             targetCpmk: targetCpmk,   
//             jumlahCpl: jumlahCpl,
//             jumlahCpmk: jumlahCpmk
//         };
//     }));

//     // 3. Filter berdasarkan Dropdown "Jenis Kurikulum"
//     // Pastikan tidak memfilter jika yang dikirim adalah kosong atau "-- Semua --"
//     if (jenisKurikulumFilter && jenisKurikulumFilter !== '-- Semua --' && jenisKurikulumFilter !== '') {
//         return result.filter(item => item.jenisKurikulum === jenisKurikulumFilter);
//     }

//     return result;
// };

// // --- SET ATURAN OBE (POST) ---
// export const setAturanObeProdi = async (payload) => {
//     const { Obe } = models;
//     // Ambil data dari payload (Frontend)
//     const { programStudiId, tahunKurikulumId, isObe, targetCpl, targetCpmk } = payload;

//     const existingObe = await Obe.findOne({
//         where: {
//             siak_program_studi_id: programStudiId,
//             siak_tahun_kurikulum_id: tahunKurikulumId
//         }
//     });

//     const isObeChecked = isObe === true || isObe === "true";

//     if (isObeChecked) {
//         if (existingObe) {
//             // FIX DI SINI: Gunakan targetCpl & targetCpmk (SESUAI MODEL)
//             existingObe.targetCpl = targetCpl || 0; 
//             existingObe.targetCpmk = targetCpmk || 0; 
            
//             // Sequelize akan mendeteksi perubahan ini dan melakukan UPDATE
//             await existingObe.save();
//         } else {
//             // Create baru juga harus pakai nama variabel sesuai Model
//             await Obe.create({
//                 siakProgramStudiId: programStudiId,
//                 siakTahunKurikulumId: tahunKurikulumId,
//                 targetCpl: targetCpl || 0,
//                 targetCpmk: targetCpmk || 0 
//             });
//         }
//         return "Berhasil diatur sebagai kurikulum OBE";
//     } else {
//         if (existingObe) {
//             await existingObe.destroy();
//         }
//         return "Berhasil diatur sebagai kurikulum Non OBE";
//     }
// };
// --- 3. CREATE DATA BARU ---
const formatIndoDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(date);
};
export const createKurikulum = async (payload) => {
    const { TahunKurikulum, PeriodeAkademik } = models;

    const newKurikulum = await TahunKurikulum.create({
        tahun: payload.tahun,
        keterangan: payload.keterangan,
        siakPeriodeAkademikId: payload.siakPeriodeAkademikId,
        tanggalMulai: payload.tanggalMulai,
        tanggalSelesai: payload.tanggalSelesai
    });

    return await TahunKurikulum.findByPk(newKurikulum.id, {
        include: [{
            model: PeriodeAkademik,
            as: 'periodeAkademik',
            attributes: ['nama']
        }]
    });
};

export const getRekapTahunKurikulum = async (queries) => {
    const { TahunKurikulum, Obe, ProgramStudi, PeriodeAkademik } = models;
    const { limit, offset } = getPagination(queries.page, queries.limit);
    const totalProdi = await ProgramStudi.count();

    const { count, rows } = await TahunKurikulum.findAndCountAll({
        // 👇 Gunakan nama properti yang ada di Model (CamelCase)
        attributes: ['id', 'tahun', 'keterangan', 'tanggalMulai', 'tanggalSelesai'], 
        include: [{
            model: PeriodeAkademik,
            as: 'periodeAkademik',
            attributes: ['nama']
        }],
        limit, offset,
        order: [['tahun', 'DESC']]
    });

    const dataFinal = await Promise.all(rows.map(async (kurikulum) => {
        const countObe = await Obe.count({ where: { siak_tahun_kurikulum_id: kurikulum.id } });
        
        return {
            id: kurikulum.id,
            tahun: kurikulum.tahun,
            mulaiBerlaku: kurikulum.periodeAkademik ? kurikulum.periodeAkademik.nama : `${kurikulum.tahun} Ganjil`,
            // 👇 PAKAI CamelCase biar datanya GAK UNDEFINED 👇
            tanggalAwal: formatIndoDate(kurikulum.tanggalMulai), 
            tanggalAkhir: formatIndoDate(kurikulum.tanggalSelesai), // 👈 SEKARANG DITAMBAHKAN
            keterangan: kurikulum.keterangan || '-',
            prodiObe: countObe,
            prodiNonObe: totalProdi - countObe
        };
    }));

    return getPagingData({ count, rows: dataFinal }, queries.page, limit);
};

export const getDaftarKurikulumProdi = async (queries) => {
    const { tahunKurikulumId, jenjangId, search, jenisKurikulum, page, limit: size } = queries;
    const { limit, offset } = getPagination(page, size);

    const whereProdi = { siak_jenjang_id: jenjangId };
    if (search) whereProdi.nama = { [Sequelize.Op.iLike]: `%${search}%` };

    // Ambil prodi dulu secara paginated
    const { count, rows } = await ProgramStudi.findAndCountAll({
        where: whereProdi,
        attributes: ['id', 'kode', 'nama'],
        limit, offset,
        order: [['kode', 'ASC']]
    });

    const dataFinal = await Promise.all(rows.map(async (prodi) => {
        const obe = await Obe.findOne({
            where: { siak_program_studi_id: prodi.id, siak_tahun_kurikulum_id: tahunKurikulumId }
        });

        let status = "Non OBE", targetCpl = 0, countCpl = 0;
        if (obe) {
            status = "OBE";
            targetCpl = obe.targetCpl || 0;
            countCpl = await CapaianPembelajaranLulusan.count({ where: { siak_obe_id: obe.id } });
        }

        return {
            programStudiId: prodi.id,
            kodeProdi: prodi.kode,
            namaProdi: prodi.nama,
            jenisKurikulum: status,
            targetCpl,
            jumlahCpl: countCpl
        };
    }));

    // Filter Manual untuk Jenis Kurikulum (Karena ini logic gabungan)
    let filteredData = dataFinal;
    if (jenisKurikulum && jenisKurikulum !== '-- Semua --') {
        filteredData = dataFinal.filter(d => d.jenisKurikulum === jenisKurikulum);
    }

    return getPagingData({ count, rows: filteredData }, page, limit);
};

export const setAturanObeProdi = async (payload) => {
    const { programStudiId, tahunKurikulumId, isObe, targetCpl, targetCpmk } = payload;
    
    const existing = await Obe.findOne({
        where: { siak_program_studi_id: programStudiId, siak_tahun_kurikulum_id: tahunKurikulumId }
    });

    if (isObe === true || isObe === "true") {
        if (existing) {
            await existing.update({ targetCpl, targetCpmk });
            return "Data OBE diperbarui";
        }
        await Obe.create({ siakProgramStudiId: programStudiId, siakTahunKurikulumId: tahunKurikulumId, targetCpl, targetCpmk });
        return "Berhasil diatur ke OBE";
    } else {
        if (existing) await existing.destroy();
        return "Berhasil diatur ke Non OBE";
    }
};

// --- 2. DETAIL PER JENJANG (Tanpa Pagination - Harus Konsisten Juga) ---
export const getDetailKurikulum = async (tahunId, jenjangId, filters) => {
    const { TahunKurikulum, PeriodeAkademik, ProgramStudi, Obe } = models;

    const header = await TahunKurikulum.findByPk(tahunId, {
        // 👇 UBAH INI: Gunakan nama properti di Model (CamelCase)
        attributes: ['id', 'tahun', 'keterangan', 'tanggalMulai', 'tanggalSelesai'],
        include: [{
            model: PeriodeAkademik,
            as: 'periodeAkademik',
            attributes: ['nama']
        }]
    });

    if (!header) throw new CustomError.NotFoundError("Data Kurikulum tidak ditemukan");

    const prodiList = await ProgramStudi.findAll({
        where: { siak_jenjang_id: jenjangId },
        attributes: ['id', 'kode', 'nama'],
        order: [['kode', 'ASC']]
    });

    const obeData = await Obe.findAll({
        where: { siak_tahun_kurikulum_id: tahunId }
    });

    let dataFinal = prodiList.map(prodi => {
        const matchingObe = obeData.find(o => o.siakProgramStudiId === prodi.id);
        return {
            programStudiId: prodi.id,
            kodeProdi: prodi.kode,
            namaProgramStudi: prodi.nama,
            isObe: !!matchingObe,
            jenisKurikulum: matchingObe ? "OBE" : "Non OBE",
            targetCpl: matchingObe ? parseFloat(matchingObe.targetCpl) : 0,
            targetCpmk: matchingObe ? parseFloat(matchingObe.targetCpmk) : 0
        };
    });

    if (filters.search) {
        dataFinal = dataFinal.filter(d => 
            d.namaProgramStudi.toLowerCase().includes(filters.search.toLowerCase())
        );
    }

    if (filters.jenisKurikulum && filters.jenisKurikulum !== '-- Semua --') {
        dataFinal = dataFinal.filter(d => d.jenisKurikulum === filters.jenisKurikulum);
    }

    // Prodi yang sudah OBE ditaruh paling atas, sisanya tetap urut kode prodi
    dataFinal.sort((a, b) => {
        if (a.isObe !== b.isObe) return a.isObe ? -1 : 1;
        return a.kodeProdi.localeCompare(b.kodeProdi);
    });

    return {
        header: {
            tahun: header.tahun,
            keterangan: header.keterangan || '-',
            mulaiBerlaku: header.periodeAkademik ? header.periodeAkademik.nama : `${header.tahun} Ganjil`,
            // 👇 PANGGIL PAKAI CamelCase biar datanya muncul (Gak strip lagi)
            tanggalAwal: formatIndoDate(header.tanggalMulai),
            tanggalAkhir: formatIndoDate(header.tanggalSelesai)
        },
        listProdi: dataFinal
    };
};

export const saveAturanObeBulk = async (payload) => {
    const { Obe } = models;
    const { tahunKurikulumId, prodiSettings } = payload;

    // Pakai transaksi biar kalau satu gagal, batal semua (lebih aman)
    const trx = await models.sequelize.transaction();

    try {
        for (const item of prodiSettings) {
            const { programStudiId, isObe, targetCpl, targetCpmk } = item;

            const existing = await Obe.findOne({
                where: { 
                    siak_program_studi_id: programStudiId, 
                    siak_tahun_kurikulum_id: tahunKurikulumId 
                },
                transaction: trx
            });

            if (isObe) {
                if (existing) {
                    await existing.update({ targetCpl, targetCpmk }, { transaction: trx });
                } else {
                    await Obe.create({
                        siakProgramStudiId: programStudiId,
                        siakTahunKurikulumId: tahunKurikulumId,
                        targetCpl: targetCpl || 0,
                        targetCpmk: targetCpmk || 0
                    }, { transaction: trx });
                }
            } else {
                if (existing) await existing.destroy({ transaction: trx });
            }
        }
        await trx.commit();
        return true;
    } catch (error) {
        await trx.rollback();
        throw error;
    }
};
// --- 4. SAVE ATURAN OBE BULK ---

// // --- 4. PREDIKAT KELULUSAN (TAB PREDIKAT) ---
// export const fetchPredikatKelulusan = async () => {
//     const { PredikatKelulusan } = models;
//     return await PredikatKelulusan.findAll({
//         order: [['ipk_min', 'DESC']]
//     });
// };

// export const upsertPredikatKelulusan = async (payload) => {
//     const { PredikatKelulusan } = models;
//     if (payload.id) {
//         const data = await PredikatKelulusan.findByPk(payload.id);
//         if (!data) throw new Error("Data Predikat tidak ditemukan");
//         return await data.update(payload);
//     } else {
//         return await PredikatKelulusan.create(payload);
//     }
// };

// export const deletePredikatKelulusan = async (id) => {
//     const { PredikatKelulusan } = models;
//     const data = await PredikatKelulusan.findByPk(id);
//     if (!data) throw new Error("Data Predikat tidak ditemukan");
//     return await data.destroy();
// };