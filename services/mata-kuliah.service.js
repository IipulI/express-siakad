import { getPagination } from "../utils/pagination.js";
import models from "../models/index.js"
import { Op } from 'sequelize';

const { sequelize, MataKuliah } = models;

export const findAll = async (page, size) => {
    try {
        if (page !== null && size !== null) {
            const { limit, offset } = getPagination(page, size);

            const { count, rows } = await MataKuliah.findAndCountAll({
                limit,
                offset,
                order: [['createdAt', 'DESC']],
            })

            return { count, rows, isPaginated: true }
        }
        else {
            const { count, rows } = await MataKuliah.findAndCountAll({})
            return { count, rows, isPaginated: false }
        }
    }
    catch (error) {
        throw new Error(`Terjadi kesalahan saat mengambil data: ${error.message}`);
    }
}

export const findOne = async (id) => {
    try {
        const existMataKuliah = await MataKuliah.findByPk(id)
        if (!existMataKuliah) {
            throw new Error(`MataKuliah doesn\'t exist`);
        }
        return existMataKuliah;
    }
    catch (error) {
        throw new Error(`Terjadi kesalahan saat mengambil data: ${error.message}`);
    }
}

export const createMataKuliah = async (mataKuliahData) => {
    try {
        const newMataKuliah = await sequelize.transaction(async (t) => {
            const createdMataKuliah = await MataKuliah.create(
                {
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
                    
                    koordinatorMkId: mataKuliahData.koordinatorMkId,
                    
                    prasyaratMataKuliah1: mataKuliahData.prasyaratMataKuliah1Id,
                    prasyaratMataKuliah2: mataKuliahData.prasyaratMataKuliah2Id,
                    prasyaratMataKuliah3: mataKuliahData.prasyaratMataKuliah3Id
                },
                { transaction: t }
            );

            // Simpan Array Pengembang RPS ke tabel pivot
            if (mataKuliahData.pengembangRpsIds && mataKuliahData.pengembangRpsIds.length > 0) {
                await createdMataKuliah.setPengembangRps(mataKuliahData.pengembangRpsIds, { transaction: t });
            }

            return createdMataKuliah;
        });

        // Mengembalikan format detail lengkap setelah berhasil create
        return await getDetailMataKuliahObe(newMataKuliah.id); 

    } catch (error) {
        console.error("🔴 ERROR DI SERVICE CREATE:", error); 
        throw new Error(error.message);
    }
}

export const updateMataKuliah = async (id, mataKuliahData) => {
    try {
        const existMataKuliah = await MataKuliah.findByPk(id);
        if (!existMataKuliah) throw new Error(`Mata Kuliah tidak ditemukan`);

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

            koordinator_mk_id: mataKuliahData.koordinatorMkId,
            
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
    } catch (error) {
        throw new Error(`Kesalahan saat memperbarui data: ${error.message}`);
    }
}

export const deleteMataKuliah = async (id) => {
    try {
        const deletedRowsCount = await MataKuliah.destroy({
            where: { id: id }
        })

        return deletedRowsCount > 0;
    }
    catch (error) {
        throw new Error(`Kesalahan saat menghapus Mata Kuliah: ${error.message}`);
    }
}

// =====================================================================
// KHUSUS MODUL OBE: GET DAFTAR & DETAIL MATA KULIAH
// =====================================================================

// ==========================================
// GET LIST OBE (Sesuai Format Tabel UI)
// ==========================================
// ==========================================
// GET LIST OBE (Status CPL Otomatis)
// ==========================================
// ==========================================
// GET LIST OBE (Status CPL Otomatis)
// ==========================================
export const getListMataKuliahObe = async (page, size, search, prodiId, tahunKurikulumId, jenis, kelompokId) => {
    try {
        // 1. Tambahkan RencanaPembelajaran ke daftar model yang di-import
        const { 
            MataKuliah, ProgramStudi, TahunKurikulum, 
            CapaianPembelajaranLulusan, CapaianMataKuliah, 
            RencanaPembelajaran // <-- Tambahkan ini
        } = models; 
        
        const limit = size ? parseInt(size) : 10;
        const offset = page ? (parseInt(page) - 1) * limit : 0;

        let andConditions = [];
        // ... (logic search/filter tetap sama) ...
        if (search) {
            andConditions.push({
                [models.Sequelize.Op.or]: [
                    { kode: { [models.Sequelize.Op.iLike]: `%${search}%` } },
                    { nama: { [models.Sequelize.Op.iLike]: `%${search}%` } }
                ]
            });
        }
        if (prodiId) andConditions.push({ siakProgramStudiId: prodiId });
        if (tahunKurikulumId) andConditions.push({ siakTahunKurikulumId: tahunKurikulumId });
        if (jenis) andConditions.push({ jenis: jenis }); 
        if (kelompokId) andConditions.push({ siakKelompokMataKuliahId: kelompokId });

        const whereClause = andConditions.length > 0 ? { [models.Sequelize.Op.and]: andConditions } : {};

        const { count, rows } = await MataKuliah.findAndCountAll({
            where: whereClause,
            include: [
                { model: ProgramStudi, as: 'programStudi', attributes: ['nama'] },
                { model: TahunKurikulum, as: 'tahunKurikulum', attributes: ['tahun'] },
                {
                    model: CapaianPembelajaranLulusan,
                    as: 'cplDipetakan',
                    attributes: ['id'],
                    through: { attributes: [] } 
                },
                {
                    model: CapaianMataKuliah,
                    as: 'cpmk',
                    attributes: ['id']
                },
                // 2. Tambahkan include ke RencanaPembelajaran
                {
                    model: RencanaPembelajaran,
                    as: 'rencanaPembelajaran', // <-- Pastikan alias ini sesuai dengan yang ada di model MataKuliah
                    attributes: ['id'],
                    limit: 1 // Cukup ambil 1 data saja untuk tahu dia "Terisi" atau tidak
                }
            ],
            distinct: true, 
            limit,
            offset,
            order: [['createdAt', 'DESC']]
        });

        const formattedData = rows.map(mk => {
            return {
                id: mk.id,
                kurikulum: mk.tahunKurikulum ? mk.tahunKurikulum.tahun : '-',
                kodeMk: mk.kode,
                namaMataKuliah: mk.nama,
                sks: mk.totalSks,
                jenisMk: mk.jenis,
                prodiPengampu: mk.programStudi ? `S1 - ${mk.programStudi.nama}` : '-',
                
                statusPengisian: {
                    // 3. Ubah logic rpsTerisi di sini 👇
                    rpsTerisi: !!(mk.rencanaPembelajaran && mk.rencanaPembelajaran.length > 0), 
                    cplTerisi: !!(mk.cplDipetakan && mk.cplDipetakan.length > 0), 
                    cpmkTerisi: !!(mk.cpmk && mk.cpmk.length > 0) 
                }
            }
        });

        return {
            totalData: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page ? parseInt(page) : 1,
            data: formattedData
        };
    } catch (error) {
        console.error("DETAIL ERROR OBE:", error); 
        throw new Error(`Gagal mengambil daftar Mata Kuliah OBE: ${error.message}`);
    }
}
export const getDetailMataKuliahObe = async (id) => {
    try {
        const { ProgramStudi, TahunKurikulum, Dosen, MataKuliah } = models; 
        
        const data = await MataKuliah.findOne({
            where: { id },
            include: [
                { model: ProgramStudi, as: 'programStudi', attributes: ['id', 'nama', 'kode'] },
                { model: TahunKurikulum, as: 'tahunKurikulum', attributes: ['id', 'tahun', 'keterangan'] },
                { model: MataKuliah, as: 'prasyarat1', attributes: ['id', 'kode', 'nama'] },
                { model: MataKuliah, as: 'prasyarat2', attributes: ['id', 'kode', 'nama'] },
                { model: MataKuliah, as: 'prasyarat3', attributes: ['id', 'kode', 'nama'] },
                
                { model: Dosen, as: 'koordinatorMk', attributes: ['id', 'nama', 'nidn'] },
                
                { 
                    model: Dosen, 
                    as: 'pengembangRps', 
                    attributes: ['id', 'nama', 'nidn'],
                    through: { attributes: [] } 
                }
            ]
        });

        if (!data) throw new Error("Data Mata Kuliah tidak ditemukan.");
        return data;
    } catch (error) {
        throw new Error(`Gagal mengambil detail Mata Kuliah OBE: ${error.message}`);
    }
}
// =====================================================================
// KHUSUS MODUL OBE: AMBIL DAFTAR CPL UNTUK PEMETAAN (CHECKBOX)
// =====================================================================
export const getCplForMapping = async (mataKuliahId) => {
    try {
        const { MataKuliah, Obe, CapaianPembelajaranLulusan, PemetaanCplMk } = models;

        // 1. Ambil detail Mata Kuliah untuk mendapatkan prodiId dan tahunKurikulumId
        const mk = await MataKuliah.findByPk(mataKuliahId, {
            attributes: ['id', 'siakProgramStudiId', 'siakTahunKurikulumId']
        });

        if (!mk) throw new Error("Mata Kuliah tidak ditemukan.");

        // 2. Cari data OBE yang sesuai dengan Prodi dan Kurikulum MK
        const obe = await Obe.findOne({
            where: {
                siakProgramStudiId: mk.siakProgramStudiId,
                siakTahunKurikulumId: mk.siakTahunKurikulumId
            },
            attributes: ['id']
        });

        // Jika data OBE belum dibuat untuk kurikulum ini, return array kosong
        if (!obe) return [];

        // 3. Ambil SEMUA Master CPL yang tersedia untuk OBE tersebut
        const allCpl = await CapaianPembelajaranLulusan.findAll({
            where: { siakObeId: obe.id },
            attributes: ['id', 'kode', 'deskripsi', 'kategori'],
            order: [['kode', 'ASC']]
        });

        // 4. Ambil CPL yang SUDAH DICEKLIS oleh Mata Kuliah ini (dari tabel pivot)
        const checkedCpl = await PemetaanCplMk.findAll({
            where: { siakMataKuliahId: mataKuliahId },
            attributes: ['siakCplId']
        });

        // Buat Set ID CPL yang diceklis agar pencarian lebih cepat
        const checkedCplIds = new Set(checkedCpl.map(c => c.siakCplId));

        // 5. FORMATTING DATA: Gabungkan master CPL dengan status isChecked
        const formattedCpl = allCpl.map(cpl => {
            return {
                idCpl: cpl.id, // ID CPL (bukan ID pivot)
                kode: cpl.kode,
                deskripsi: cpl.deskripsi,
                kategori: cpl.kategori,
                // Cek apakah ID CPL ini ada di dalam Set CPL yang diceklis
                isChecked: checkedCplIds.has(cpl.id) 
            };
        });

        return formattedCpl;

    } catch (error) {
        throw new Error(`Gagal mengambil daftar CPL untuk pemetaan: ${error.message}`);
    }
}

// =====================================================================
// KHUSUS MODUL OBE: SIMPAN PEMETAAN CPL (TAMBAH & UPDATE)
// =====================================================================
// HARUS ADA KATA "export" DI DEPANNYA
export const savePemetaanCpl = async (mataKuliahId, cplIds) => {
    try {
        const { MataKuliah } = models;

        const mk = await MataKuliah.findByPk(mataKuliahId);
        if (!mk) throw new Error("Mata Kuliah tidak ditemukan.");

        // Simpan ke database
        await mk.setCplDipetakan(cplIds || []);

        // PASTIKAN BARIS INI ADA UNTUK ME-RETURN DATA TERBARU 👇
        return await getCplForMapping(mataKuliahId);

    } catch (error) {
        throw new Error(`Gagal menyimpan pemetaan CPL: ${error.message}`);
    }
}
// --- 1. REKAP DISTRIBUSI SKS (Halaman 1 / Index) ---
export const getRekapDistribusiSks = async (prodiId) => {
    const { TahunKurikulum, MataKuliah } = models;

    // Ambil semua Tahun Kurikulum yang aktif
    const listTahunKurikulum = await TahunKurikulum.findAll({
        order: [['tahun', 'DESC']] // Urutkan dari tahun terbaru (2025 ke bawah)
    });

    // Hitung SKS per tahun kurikulum untuk prodi tersebut
    const result = await Promise.all(listTahunKurikulum.map(async (kurikulum) => {
        // Ambil semua MK di prodi dan tahun kurikulum ini
        const daftarMk = await MataKuliah.findAll({
            where: {
                siak_program_studi_id: prodiId,
                siak_tahun_kurikulum_id: kurikulum.id
            },
            attributes: ['opsi_wajib', 'total_sks']
        });

        let sksWajib = 0;
        let sksPilihan = 0;

        // Kalkulasi SKS
        daftarMk.forEach(mk => {
            if (mk.opsi_wajib === true) {
                sksWajib += (mk.total_sks || 0);
            } else {
                sksPilihan += (mk.total_sks || 0);
            }
        });

        return {
            tahunKurikulumId: kurikulum.id,
            tahun: kurikulum.tahun,
            keterangan: kurikulum.keterangan,
            sksWajib: sksWajib,
            sksPilihan: sksPilihan,
            totalSks: sksWajib + sksPilihan
        };
    }));

    return result;
};

// --- 2. DAFTAR MATA KULIAH PER SEMESTER (Halaman Detail MK) ---
export const getMataKuliahPerSemester = async (prodiId, tahunKurikulumId) => {
    const { MataKuliah } = models;

    const listMk = await MataKuliah.findAll({
        where: {
            siak_program_studi_id: prodiId,
            siak_tahun_kurikulum_id: tahunKurikulumId
        },
        order: [
            ['semester', 'ASC'], // Urutkan berdasarkan semester terkecil (1, 2, 3...)
            ['kode', 'ASC']      // Lalu urutkan berdasarkan kode MK (A-Z)
        ]
    });

    return listMk;
};