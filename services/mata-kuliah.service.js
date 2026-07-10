import { getPagination } from "../utils/pagination.js";
import models from "../models/index.js";
import { Op } from 'sequelize';

import * as CustomError from "../utils/custom-error.js";
import { NotFoundError } from "../utils/custom-error.js";

const {
    sequelize,
    ProgramStudi,
    MataKuliah,
    TahunKurikulum,
} = models;

// =========================================================
// 1. GET LIST MATA KULIAH OBE (Dipanggil oleh Controller OBE)
// =========================================================
export const getListMataKuliahObe = async (page, size, search, prodiId, tahunKurikulumId) => {
    // 👇 1. PASTIKAN SEMUA MODEL DI-DESTRUCTURE DULU DI SINI
    const {
        MataKuliah,
        ProgramStudi,
        TahunKurikulum,
        CapaianMataKuliah,
        Rps
    } = models;

    // 2. Hitung limit & offset untuk pagination
    const { limit, offset } = getPagination(page, size);

    // 3. Setup Filter
    const whereClause = {};
    if (prodiId) whereClause.siakProgramStudiId = prodiId;
    if (tahunKurikulumId) whereClause.siakTahunKurikulumId = tahunKurikulumId;

    if (search) {
        whereClause[Op.or] = [
            { nama: { [Op.iLike]: `%${search}%` } },
            { kode: { [Op.iLike]: `%${search}%` } }
        ];
    }

    // 4. Query ke Database
    const data = await MataKuliah.findAndCountAll({
        where: whereClause,
        limit,
        offset,
        order: [['createdAt', 'DESC']],
        include: [
            // 👇 Sekarang variabel ProgramStudi & TahunKurikulum sudah aman karena sudah di-destructure di atas
            { model: ProgramStudi, as: 'programStudi', attributes: ['nama'] },
            { model: TahunKurikulum, as: 'tahunKurikulum', attributes: ['tahun'] }
        ]
    });

    // 5. Mapping Data & Cek Status Pengisian
    const formattedRows = await Promise.all(data.rows.map(async (mk) => {
        // Cek CPL (Pakai count dari relasi)
        const countCpl = await mk.countCplDipetakan();

        const countCpmk = await CapaianMataKuliah.count({
            where: { siakMataKuliahId: mk.id }
        });

        const countRps = await Rps.count({
            where: { siakMataKuliahId: mk.id }
        });

        return {
            id: mk.id,
            kurikulum: mk.tahunKurikulum?.tahun || '-',
            kodeMk: mk.kode,
            namaMataKuliah: mk.nama,
            sks: mk.totalSks,
            jenisMk: mk.jenis,
            prodiPengampu: mk.programStudi?.nama || '-',
            statusPengisian: {
                isRpsTerisi: countRps > 0,
                isCplTerisi: countCpl > 0,
                isCpmkTerisi: countCpmk > 0
            }
        };
    }));

    return {
        count: data.count,
        rows: formattedRows
    };
};

// =========================================================
// 2. GET DETAIL MATA KULIAH OBE (Tampilan Detail Frontend)
// =========================================================
export const getDetailMataKuliahObe = async (id) => {
    // 👇 KUNCI: Tarik semua model dari 'models' supaya gak "is not defined"
    const {
        MataKuliah,
        ProgramStudi,
        TahunKurikulum,
        Dosen,
        KelompokMataKuliah
    } = models;

    // 1. Cari data berdasarkan Primary Key (ID)
    const mk = await MataKuliah.findByPk(id, {
        include: [
            { model: ProgramStudi, as: 'programStudi', attributes: ['nama'] },
            { model: TahunKurikulum, as: 'tahunKurikulum', attributes: ['tahun'] },
            { model: Dosen, as: 'koordinatorMk', attributes: ['id', 'nama', 'nidn'] },
            { model: Dosen, as: 'pengembangRps', attributes: ['id', 'nama', 'nidn'], through: { attributes: [] } },
            { model: KelompokMataKuliah, as: 'kelompokMk', attributes: ['nama'] }
        ]
    });

    // 2. CEK: Kalau ID ngasal/data ga ketemu, langsung tembak 404
    if (!mk) {
        throw new CustomError.NotFoundError(`Mata Kuliah dengan ID ${id} tidak ditemukan.`);
    }

    // 3. MAPPING: Susun datanya biar rapi buat Frontend
    return {
        id: mk.id,
        tahunKurikulum: mk.tahunKurikulum?.tahun || '-',
        kodeMataKuliah: mk.kode,
        namaMataKuliahInd: mk.nama,
        namaMataKuliahEn: mk.namaEn || '-',
        jenisMataKuliah: mk.jenis,
        totalSks: mk.totalSks,
        unitPengampu: mk.programStudi?.nama || '-',
        kelompokMataKuliah: mk.kelompokMk?.nama || '-',
        atribut: {
            merupakanMku: mk.merupakanMku,
            adaSap: mk.adaSap,
            adaSilabus: mk.adaSilabus,
            adaBahanAjar: mk.adaBahanAjar,
            adaDiktat: mk.adaDiktat,
        },
        koordinatorMataKuliah: mk.koordinatorMk ? {
            id: mk.koordinatorMk.id,
            label: `${mk.koordinatorMk.nidn} - ${mk.koordinatorMk.nama}`
        } : null,
        pengembangRps: mk.pengembangRps ? mk.pengembangRps.map(dosen => ({
            id: dosen.id,
            label: `${dosen.nidn} - ${dosen.nama}`
        })) : []
    };
};
// =========================================================
// 3. FIND ALL (Bawaan)
// =========================================================
export const findAll = async (page, size, search, order, tahunKurikulumId, siakProgramStudiId) => {
    const isPaginated = page !== null && size !== null;

    const queryBuilder = {
        attributes: {
            exclude: ['createdAt', 'updatedAt', 'deletedAt']
        },
        where: {},
        include: [
            {
                attributes: ['id', 'kode', 'nama'],
                model: ProgramStudi,
                as: 'programStudi',
            },
            {
                attributes: ['id', 'tahun'],
                model: TahunKurikulum,
                as: 'tahunKurikulum',
            }
        ],
        order: [['id', 'DESC']],
    }

    if (search) {
        queryBuilder.where[Op.or] = [
            { nama: { [Op.iLike]: `%${search}%` } },
            { kode: { [Op.iLike]: `%${search}%` } }
        ];
    }
    if (tahunKurikulumId) queryBuilder.where.siakTahunKurikulumId = tahunKurikulumId;
    if (siakProgramStudiId) queryBuilder.where.siakProgramStudiId = siakProgramStudiId;

    if (isPaginated) {
        const { limit, offset } = getPagination(page, size);

        queryBuilder.limit = limit;
        queryBuilder.offset = offset;

        const { count, rows } = await MataKuliah.findAndCountAll(queryBuilder);

        return {
            count,
            rows,
            isPaginated: true
        }
    } else {
        const  data = await MataKuliah.findAll(queryBuilder);

        return {
            count: data.length,
            rows: data,
            isPaginated: false
        }
    }
}

export const findOne = async (id) => {
    const cekDataMataKuliah = await MataKuliah.findByPk(id, {
        include: [
            {
                attributes: ['id', 'kode', 'nama'],
                model: ProgramStudi,
                as: 'programStudi',
            },
            {
                attributes: ['id', 'tahun'],
                model: TahunKurikulum,
                as: 'tahunKurikulum',
            },
            {
                attributes: [
                    'id', 'nama', 'kode'
                ],
                model:MataKuliah,
                as: 'prasyarat1'
            },
            {
                attributes: [
                    'id', 'nama', 'kode'
                ],
                model:MataKuliah,
                as: 'prasyarat2'
            },
            {
                attributes: [
                    'id', 'nama', 'kode'
                ],
                model:MataKuliah,
                as: 'prasyarat3'
            },
        ],
    })

    if (!cekDataMataKuliah) {
        throw new NotFoundError("Mata Kuliah tidak dapat ditemukan")
    }

    return cekDataMataKuliah
}

// =========================================================
// 5. CREATE MATA KULIAH
// =========================================================
export const createMataKuliah = async (mataKuliahData) => {
    const programStudiExist = await ProgramStudi.findByPk(mataKuliahData.siakProgramStudiId, {
        attributes: ['id'],
    })
    if (!programStudiExist) {
        throw new Error(`Program studi tidak ditemukan`);
    }

    const tahunKurikulum = await TahunKurikulum.findByPk(mataKuliahData.siakTahunKurikulumId)
    if (!tahunKurikulum) {
        throw new Error(`Tahun kurikulum tidak ditemukan`);
    }

    const newMataKuliah = await sequelize.transaction(async (t) => {
        await validatePrasyarat(mataKuliahData, t);

        const createdMataKuliah = await MataKuliah.create(
            {
                siakProgramStudiId: mataKuliahData.siakProgramStudiId,
                siakTahunKurikulumId: mataKuliahData.siakTahunKurikulumId,

                siakBidangIlmuId : mataKuliahData.siakBidangIlmuId,
                siakJenisMataKuliahId : mataKuliahData.siakJenisMataKuliahId,
                siakKelompokMataKuliahId : mataKuliahData.siakKelompokMataKuliahId,

                nama: mataKuliahData.nama,
                kode: mataKuliahData.kode,
                jenis: mataKuliahData.jenis,
                adaPraktikum: mataKuliahData.adaPraktikum,
                sksTatapMuka: mataKuliahData.sksTatapMuka,
                sksPraktikum: mataKuliahData.sksPraktikum,
                sksPraktikLapangan: mataKuliahData.sksPraktikLapangan,
                totalSks: mataKuliahData.sksTatapMuka + mataKuliahData.sksPraktikum + mataKuliahData.sksPraktikLapangan,

                prasyaratMataKuliah1: mataKuliahData.prasyaratMataKuliah1Id,
                prasyaratMataKuliah2: mataKuliahData.prasyaratMataKuliah2Id,
                prasyaratMataKuliah3: mataKuliahData.prasyaratMataKuliah3Id
            },
            {
                transaction: t,
                logging: true
            }
        )

        // Simpan Array Pengembang RPS ke tabel pivot
        if (mataKuliahData.pengembangRpsIds && mataKuliahData.pengembangRpsIds.length > 0) {
            await createdMataKuliah.setPengembangRps(mataKuliahData.pengembangRpsIds, { transaction: t });
        }

        // return if success
        return createdMataKuliah
    })

    return await getDetailMataKuliahObe(newMataKuliah.id);
}

//OBE
export const createMataKuliahObe = async (payload) => {
    // Gunakan transaksi agar data konsisten
    const result = await sequelize.transaction(async (t) => {

        // 1. Cek duplikasi kode (Conflict 409)
        const existing = await MataKuliah.findOne({
            where: { kode: payload.kode, siakTahunKurikulumId: payload.siakTahunKurikulumId },
            transaction: t
        });
        if (existing) throw new CustomError.ConflictError(`Kode MK ${payload.kode} sudah ada di kurikulum ini!`);

        // 2. Create Data Utama
        const newMk = await MataKuliah.create({
            siakProgramStudiId: payload.siakProgramStudiId,
            siakTahunKurikulumId: payload.siakTahunKurikulumId,
            siakKelompokMataKuliahId: payload.kelompokMataKuliahId,
            siakRumpunMataKuliahId: payload.rumpunMataKuliahId,
            kode: payload.kode,
            nama: payload.nama,
            namaEn: payload.namaEn,
            jenis: payload.jenis,
            adaPraktikum: payload.adaPraktikum,
            sksTatapMuka: payload.sksTatapMuka || 0,
            sksPraktikum: payload.sksPraktikum || 0,
            sksPraktikLapangan: payload.sksPraktikLapangan || 0,
            sksSimulasi: payload.sksSimulasi || 0,
            // Hitung total SKS otomatis
            totalSks: (payload.sksTatapMuka || 0) + (payload.sksPraktikum || 0) + (payload.sksPraktikLapangan || 0) + (payload.sksSimulasi || 0),
            merupakanMku: payload.merupakanMku,
            adaSap: payload.adaSap,
            adaSilabus: payload.adaSilabus,
            adaBahanAjar: payload.adaBahanAjar,
            adaDiktat: payload.adaDiktat,
            koordinatorMkId: payload.koordinatorMkId,
        }, { transaction: t });

        // 3. Simpan Relasi Many-to-Many (Pengembang RPS)
        if (payload.pengembangRpsIds && payload.pengembangRpsIds.length > 0) {
            await newMk.setPengembangRps(payload.pengembangRpsIds, { transaction: t });
        }

        return newMk;
    });

    // 4. Balikin data dalam format DETAIL (panggil service detail yang sudah ada)
    // Supaya response 201-nya langsung rapi sesuai permintaan UI
    return await getDetailMataKuliahObe(result.id);
};

// =========================================================
// 6. UPDATE MATA KULIAH
// =========================================================
export const updateMataKuliah = async (id, mataKuliahData) => {
    const existMataKuliah = await MataKuliah.findByPk(id);
    if (!existMataKuliah) {
        throw new Error(`Mata Kuliah tidak ditemukan`);
    }

    await MataKuliah.update({
        siakProgramStudiId: mataKuliahData.siakProgramStudiId,
        siakTahunKurikulumId: mataKuliahData.siakTahunKurikulumId,
        siakKelompokMataKuliahId: mataKuliahData.kelompokMataKuliahId,
        siakRumpunMataKuliahId: mataKuliahData.rumpunMataKuliahId,
        nama: mataKuliahData.nama,
        namaEn: mataKuliahData.namaEn,
        kode: mataKuliahData.kode,
        jenis: mataKuliahData.jenis,
        adaPraktikum: mataKuliahData.adaPraktikum,

        sksTatapMuka: mataKuliahData.sksTatapMuka,
        sksPraktikum: mataKuliahData.sksPraktikum,
        sksPraktikLapangan: mataKuliahData.sksPraktikLapangan,
        sksSimulasi: mataKuliahData.sksSimulasi,
        totalSks: (mataKuliahData.sksTatapMuka || 0) +
            (mataKuliahData.sksPraktikum || 0) +
            (mataKuliahData.sksPraktikLapangan || 0) +
            (mataKuliahData.sksSimulasi || 0),

        merupakanMku: mataKuliahData.merupakanMku,
        adaSap: mataKuliahData.adaSap,
        adaSilabus: mataKuliahData.adaSilabus,
        adaBahanAjar: mataKuliahData.adaBahanAjar,
        adaDiktat: mataKuliahData.adaDiktat,

        koordinatorMkId: mataKuliahData.koordinatorMkId, // PERBAIKAN: disamakan dengan model ORM

        prasyaratMataKuliah1: mataKuliahData.prasyaratMataKuliah1Id,
        prasyaratMataKuliah2: mataKuliahData.prasyaratMataKuliah2Id,
        prasyaratMataKuliah3: mataKuliahData.prasyaratMataKuliah3Id
    }, { where: { id: id } });

    // UPDATE DATA PENGEMBANG RPS DI TABEL PIVOT
    if (mataKuliahData.pengembangRpsIds) {
        await existMataKuliah.setPengembangRps(mataKuliahData.pengembangRpsIds);
    }

    // Mengembalikan format detail lengkap setelah berhasil update
    return await getDetailMataKuliahObe(id);
}

// =========================================================
// 7. DELETE MATA KULIAH
// =========================================================
export const deleteMataKuliah = async (id) => {
    const cekDataMataKuliah = await MataKuliah.findByPk(id)
    if (!cekDataMataKuliah) {
        throw new NotFoundError("Mata Kuliah tidak dapat ditemukan")
    }

    await cekDataMataKuliah.destroy()
}

// Private function
const validatePrasyarat = async (mataKuliahData, transaction) => {
    for (let i = 1; i <= 3; i++) {
        const prasyaratId = mataKuliahData[`prasyaratMataKuliah${i}Id`];
        if (prasyaratId) {
            const prasyarat = await MataKuliah.findByPk(prasyaratId, {
                transaction,
                lock: transaction.LOCK
            });
            if (!prasyarat) {
                throw new Error(`Prasyarat Mata Kuliah ${i} tidak ditemukan`);
            }
        }
    }
}
// =========================================================
// 8. GET CPL FOR MAPPING (Menampilkan CPL yang dipetakan ke MK)
// =========================================================

// export const getCplForMapping = async (mataKuliahId) => {
//     try {
//         const mk = await MataKuliah.findByPk(mataKuliahId, {
//             // ✅ TAMBAHAN: Masukkan totalSks dan jenis
//             attributes: ['id', 'kode', 'nama', 'totalSks', 'jenis'],
//             include: [
//                 // ✅ TAMBAHAN: Tarik nama Prodi untuk "Unit Pengampu"
//                 { model: models.ProgramStudi, as: 'programStudi', attributes: ['nama'] },

//                 // ✅ TAMBAHAN: Tarik Tahun Kurikulum
//                 { model: models.TahunKurikulum, as: 'tahunKurikulum', attributes: ['tahun'] },

//                 {
//                     model: models.CapaianPembelajaranLulusan,
//                     as: 'cplDipetakan',
//                     // Kalau CPL punya deskripsi bahasa Inggris di tabel, tambahkan 'deskripsiEn'
//                     attributes: ['id', 'kode', 'deskripsi'],
//                     through: { attributes: [] }
//                 }
//             ],
//             order: [
//                 [{ model: models.CapaianPembelajaranLulusan, as: 'cplDipetakan' }, 'kode', 'ASC']
//             ]
//         });

//         if (!mk) {
//             throw new Error(`Mata Kuliah tidak ditemukan`);
//         }

//         // ✅ FORMAT ULANG MATA KULIAH AGAR PAS DENGAN HEADER UI
//         return {
//             mataKuliah: {
//                 id: mk.id,
//                 kodeMataKuliah: mk.kode,
//                 namaMataKuliah: mk.nama,
//                 tahunKurikulum: mk.tahunKurikulum?.tahun || '-',
//                 sks: mk.totalSks,
//                 jenisMataKuliah: mk.jenis,
//                 unitPengampu: mk.programStudi?.nama || '-'
//             },
//             cplList: mk.cplDipetakan || []
//         };

//     } catch (error) {
//         throw new Error(`Gagal mengambil data CPL untuk pemetaan: ${error.message}`);
//     }
// }

// // =========================================================
// // 9. SAVE PEMETAAN CPL (Menyimpan mapping MK ke CPL)
// // =========================================================
// export const savePemetaanCpl = async (mataKuliahId, cplIdsArray) => {
//     try {
//         // Cari data Mata Kuliah-nya dulu
//         const mk = await MataKuliah.findByPk(mataKuliahId);
//         if (!mk) {
//             throw new Error(`Mata Kuliah tidak ditemukan`);
//         }

//         // ✅ FIX: Langsung pakai cplIdsArray karena sudah diekstrak oleh Controller
//         // Kalau null/undefined, jadikan array kosong
//         const cplTerpilih = cplIdsArray || [];

//         // Gunakan Magic Method dari Sequelize (berdasarkan alias 'cplDipetakan')
//         // Otomatis melakukan "Wipe and Replace"
//         await mk.setCplDipetakan(cplTerpilih);

//         // Setelah berhasil disimpan, kembalikan data terbarunya
//         return await getCplForMapping(mataKuliahId);

//     } catch (error) {
//         throw new Error(`Gagal menyimpan pemetaan CPL: ${error.message}`);
//     }
// }
/**
 * 1. GET: Ambil Data CPL yang dipetakan ke satu Mata Kuliah
 */
export const getCplForMapping = async (mataKuliahId) => {
    // 👇 KUNCI: Panggil semua model di sini
    const { MataKuliah, ProgramStudi, TahunKurikulum, CapaianPembelajaranLulusan, Obe } = models;

    const mk = await MataKuliah.findByPk(mataKuliahId, {
        attributes: ['id', 'kode', 'nama', 'totalSks', 'jenis', 'siakProgramStudiId', 'siakTahunKurikulumId'],
        include: [
            { model: ProgramStudi, as: 'programStudi', attributes: ['nama'] },
            { model: TahunKurikulum, as: 'tahunKurikulum', attributes: ['tahun'] },
            {
                model: CapaianPembelajaranLulusan,
                as: 'cplDipetakan', // Sesuaikan dengan alias di models/index.js
                attributes: ['id', 'kode', 'deskripsi'],
                through: { attributes: [] } // Sembunyikan tabel pivot
            }
        ]
    });

    if (!mk) throw new CustomError.NotFoundError(`Mata Kuliah tidak ditemukan.`);

    // Ambil SEMUA CPL milik OBE (prodi + kurikulum) MK ini, untuk opsi checkbox
    const obe = await Obe.findOne({
        where: { siakProgramStudiId: mk.siakProgramStudiId, siakTahunKurikulumId: mk.siakTahunKurikulumId }
    });

    const idCplTerpilih = new Set((mk.cplDipetakan || []).map(c => c.id));
    let daftarCpl = [];

    if (obe) {
        const semuaCpl = await CapaianPembelajaranLulusan.findAll({
            where: { siakObeId: obe.id },
            attributes: ['id', 'kode', 'deskripsi'],
            order: [['kode', 'ASC']]
        });

        // Deduplicate by kode (data lama bisa punya CPL kode sama dengan id berbeda)
        const cplByKode = new Map();
        semuaCpl.forEach(cpl => {
            if (!cplByKode.has(cpl.kode)) {
                cplByKode.set(cpl.kode, { id: cpl.id, kode: cpl.kode, deskripsi: cpl.deskripsi, ids: [cpl.id] });
            } else {
                cplByKode.get(cpl.kode).ids.push(cpl.id);
            }
        });

        daftarCpl = Array.from(cplByKode.values()).map(item => ({
            id: item.id,
            kode: item.kode,
            deskripsi: item.deskripsi,
            isMapped: item.ids.some(id => idCplTerpilih.has(id))
        }));
    }

    return {
        header: {
            id: mk.id,
            kode: mk.kode,
            nama: mk.nama,
            sks: mk.totalSks,
            jenis: mk.jenis,
            prodi: mk.programStudi?.nama || '-',
            kurikulum: mk.tahunKurikulum?.tahun || '-'
        },
        daftarCpl,
        cplTerpilih: mk.cplDipetakan || []
    };
};

/**
 * 2. SAVE/UPDATE: Simpan Pemetaan (Wipe and Replace)
 */
export const savePemetaanCpl = async (mataKuliahId, cplIdsArray) => {
    const mk = await MataKuliah.findByPk(mataKuliahId);
    if (!mk) throw new CustomError.NotFoundError(`Mata Kuliah tidak ditemukan`);

    // Sequelize 'set...' otomatis menghapus yang lama dan memasukkan yang baru
    await mk.setCplDipetakan(cplIdsArray || []);

    // Return data terbaru setelah diupdate
    return await getCplForMapping(mataKuliahId);
};

/**
 * 3. DELETE: Kosongkan semua pemetaan CPL untuk MK ini
 */
export const deletePemetaanCpl = async (mataKuliahId) => {
    const mk = await MataKuliah.findByPk(mataKuliahId);
    if (!mk) throw new CustomError.NotFoundError(`Mata Kuliah tidak ditemukan`);

    // Mengeset array kosong = menghapus semua relasi di tabel pivot
    await mk.setCplDipetakan([]);
    return true;
};