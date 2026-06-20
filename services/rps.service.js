import models from "../models/index.js";
import { getPagination } from "../utils/pagination.js";
import * as CustomError from "../utils/custom-error.js";
import { Op } from "sequelize";
import { hitungNilaiAkhir } from "./penilaian.service.js";
import { getCpmkColumnsForMataKuliah } from "./cpmk.service.js";

const { 
    sequelize, Rps, MataKuliah, ProgramStudi, TahunKurikulum, 
    Jenjang, PeriodeAkademik, RencanaPembelajaran, CapaianMataKuliah 
} = models;

const _cekMK = async (mataKuliahId, trx) => {
    const mk = await MataKuliah.findByPk(mataKuliahId, { transaction: trx });
    if (!mk) throw new Error("Mata Kuliah tidak ditemukan");
};

// Helper Header MK agar seragam di semua Halaman RPS
const getHeaderMk = async (id) => {
    const mk = await MataKuliah.findByPk(id, {
        include: [
            { model: ProgramStudi, as: 'programStudi', attributes: ['nama', 'siakJenjangId'] },
            { model: TahunKurikulum, as: 'tahunKurikulum', attributes: ['tahun'] }
        ]
    });
    if (!mk) throw new CustomError.NotFoundError("Mata Kuliah tidak ditemukan");
    
    // Trik bypass Jenjang
    let teksUnitPengampu = '-';
    if (mk.programStudi) {
        const jenjang = mk.programStudi.siakJenjangId ? await Jenjang.findByPk(mk.programStudi.siakJenjangId) : { jenjang: 'S1' };
        teksUnitPengampu = `${jenjang?.jenjang || 'S1'} - ${mk.programStudi.nama}`;
    }

    return {
        id: mk.id, kode: mk.kode, nama: mk.nama, totalSks: mk.totalSks,
        jenis: mk.jenis || 'Kuliah', tahunKurikulum: mk.tahunKurikulum?.tahun || '-',
        unitPengampu: teksUnitPengampu
    };
};

// =========================================================
// GET: Ambil Data untuk Render UI Detail RPS (Halaman 6)
// =========================================================
export const getFormDetailRps = async (mataKuliahId, periodeId = null) => {
    try {
        // 1. Ambil data Mata Kuliah beserta Program Studi
        const mk = await MataKuliah.findByPk(mataKuliahId, {
            attributes: ['id', 'kode', 'nama', 'totalSks', 'jenis'],
            include: [
                { model: ProgramStudi, as: 'programStudi', attributes: ['nama', 'siakJenjangId'] },
                { model: TahunKurikulum, as: 'tahunKurikulum', attributes: ['tahun'] }
            ]
        });

        if (!mk) throw new Error("Mata Kuliah tidak ditemukan");

        // 2. Format Unit Pengampu (Bypass Jenjang)
        let teksUnitPengampu = '-';
        if (mk.programStudi) {
            let namaJenjang = 'S1'; 
            if (mk.programStudi.siakJenjangId) {
                const jenjang = await Jenjang.findByPk(mk.programStudi.siakJenjangId);
                if (jenjang) namaJenjang = jenjang.jenjang; 
            }
            teksUnitPengampu = `${namaJenjang} - ${mk.programStudi.nama}`;
        }

        const formattedMk = {
            id: mk.id,
            kode: mk.kode,
            nama: mk.nama,
            totalSks: mk.totalSks,
            jenis: mk.jenis || '-',
            tahunKurikulum: mk.tahunKurikulum ? mk.tahunKurikulum.tahun : '-',
            unitPengampu: teksUnitPengampu
        };

        // 3. Ambil Daftar Periode Akademik
        const daftarPeriode = await PeriodeAkademik.findAll({
            attributes: ['id', 'nama', 'status'],
            order: [['tanggal_mulai', 'DESC']]
        });

        // 👇 PERBAIKAN 1: RADAR PENDETEKSI DATA RPS 👇
        // Cari periode mana saja yang sudah ada RPS-nya untuk Mata Kuliah ini
        const rpsTersedia = await Rps.findAll({
            where: { siakMataKuliahId: mataKuliahId },
            attributes: ['siakPeriodeAkademikId']
        });
        const listPeriodeAdaRps = rpsTersedia.map(r => r.siakPeriodeAkademikId);

        // Sisipkan boolean 'adaDataRps' ke dalam daftar periode
        const formattedPeriode = daftarPeriode.map(p => ({
            id: p.id,
            nama: p.nama,
            status: p.status,
            adaDataRps: listPeriodeAdaRps.includes(p.id) // True jika ID periode ada di database RPS
        }));

        // 4. Ambil Detail RPS (Berdasarkan Periode Terpilih)
        let whereClause = { siakMataKuliahId: mataKuliahId };
        if (periodeId) {
            whereClause.siakPeriodeAkademikId = periodeId;
        }

        const rpsDetail = await Rps.findOne({
            where: whereClause,
            attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] },
            include: [{ model: PeriodeAkademik, as: 'periode', attributes: ['nama'] }]
        });

        // 👇 PERBAIKAN 2: FORMAT URL FILE DOKUMEN RPS 👇
        let formattedRpsData = null;
        if (rpsDetail) {
            formattedRpsData = {
                ...rpsDetail.toJSON(),
    
                dokumenRpsUrl: rpsDetail.dokumenRps && rpsDetail.dokumenRps !== "-" ? `http://localhost:3000/${rpsDetail.dokumenRps}` : null,
                dokumenRpsNamaFile: rpsDetail.dokumenRps && rpsDetail.dokumenRps !== "-" ? rpsDetail.dokumenRps.split('/').pop() : null
            };
        }

        return {
            mataKuliah: formattedMk,
            daftarPeriode: formattedPeriode, // <-- Gunakan yang sudah diformat
            rpsData: formattedRpsData        // <-- Gunakan data RPS yang URL filenya sudah diekstrak
        };
    } catch (error) {
        throw new Error(`Gagal memuat form RPS: ${error.message}`);
    }
};
// =========================================================
// PRATINJAU SALIN Detail RPS (lihat isi RPS periode asal sebelum disalin)
// =========================================================
export const pratinjauSalinDetailRps = async (mataKuliahId, periodeAsalId) => {
    const rpsAsal = await Rps.findOne({
        where: { siakMataKuliahId: mataKuliahId, siakPeriodeAkademikId: periodeAsalId },
        include: [{ model: PeriodeAkademik, as: 'periode', attributes: ['nama'] }]
    });
    if (!rpsAsal) throw new CustomError.NotFoundError("Detail RPS pada periode asal belum diisi");

    return {
        periodeAsal: rpsAsal.periode?.nama || '-',
        tanggalPenyusunan: rpsAsal.tanggalPenyusunan,
        deskripsiMataKuliah: rpsAsal.deskripsiMataKuliah,
        deskripsiMataKuliahEng: rpsAsal.deskripsiMataKuliahEng,
        tujuanMataKuliah: rpsAsal.tujuanMataKuliah,
        materiPembelajaran: rpsAsal.materiPembelajaran,
        pustakaUtama: rpsAsal.pustakaUtama,
        pustakaPendukung: rpsAsal.pustakaPendukung,
        mediaPerangkatLunak: rpsAsal.mediaPerangkatLunak,
        mediaPerangkatKeras: rpsAsal.mediaPerangkatKeras
    };
};

// =========================================================
// SALIN Detail RPS antar Periode (wipe & replace periode tujuan)
// =========================================================
export const salinDetailRps = async (mataKuliahId, periodeAsalId, periodeTujuanId) => {
    if (periodeAsalId === periodeTujuanId) {
        throw new CustomError.BadRequestError("Periode asal dan tujuan tidak boleh sama");
    }

    const rpsAsal = await Rps.findOne({
        where: { siakMataKuliahId: mataKuliahId, siakPeriodeAkademikId: periodeAsalId }
    });
    if (!rpsAsal) throw new CustomError.NotFoundError("Detail RPS pada periode asal belum diisi");

    return await sequelize.transaction(async (trx) => {
        await _cekMK(mataKuliahId, trx);

        const rpsTujuan = await Rps.findOne({
            where: { siakMataKuliahId: mataKuliahId, siakPeriodeAkademikId: periodeTujuanId },
            transaction: trx
        });

        const payload = {
            siakMataKuliahId: mataKuliahId,
            siakPeriodeAkademikId: periodeTujuanId,
            tanggalPenyusunan: rpsAsal.tanggalPenyusunan,
            deskripsiMataKuliah: rpsAsal.deskripsiMataKuliah,
            deskripsiMataKuliahEng: rpsAsal.deskripsiMataKuliahEng,
            tujuanMataKuliah: rpsAsal.tujuanMataKuliah,
            materiPembelajaran: rpsAsal.materiPembelajaran,
            pustakaUtama: rpsAsal.pustakaUtama,
            pustakaPendukung: rpsAsal.pustakaPendukung,
            mediaPerangkatLunak: rpsAsal.mediaPerangkatLunak,
            mediaPerangkatKeras: rpsAsal.mediaPerangkatKeras,
            dokumenRps: rpsAsal.dokumenRps
        };

        if (rpsTujuan) {
            await Rps.update(payload, { where: { id: rpsTujuan.id }, transaction: trx });
        } else {
            await Rps.create(payload, { transaction: trx });
        }
    }).then(() => getFormDetailRps(mataKuliahId, periodeTujuanId));
    // ☝️ getFormDetailRps dipanggil SETELAH transaksi commit, supaya baca data yang baru disimpan
};

// =========================================================
// POST/PUT: Simpan Data Detail RPS
// =========================================================
export const upsertDetailRps = async (mataKuliahId, rpsData, file) => {
    try {
        return await sequelize.transaction(async (trx) => {
            await _cekMK(mataKuliahId, trx); 

            const existingRps = await Rps.findOne({
                where: { 
                    siakMataKuliahId: mataKuliahId,
                    siakPeriodeAkademikId: rpsData.siakPeriodeAkademikId 
                },
                transaction: trx
            });

            let filePath = "-"; 
            if (file) {
                filePath = file.path; 
            } else if (existingRps && existingRps.dokumenRps) {
                filePath = existingRps.dokumenRps;
            }

            const payload = {
                siakMataKuliahId: mataKuliahId,
                siakPeriodeAkademikId: rpsData.siakPeriodeAkademikId, 
                tanggalPenyusunan: rpsData.tanggalPenyusunan,
                deskripsiMataKuliah: rpsData.deskripsiMataKuliah,
                deskripsiMataKuliahEng: rpsData.deskripsiMataKuliahEng, 
                tujuanMataKuliah: rpsData.tujuanMataKuliah,
                materiPembelajaran: rpsData.materiPembelajaran,
                pustakaUtama: rpsData.pustakaUtama,
                pustakaPendukung: rpsData.pustakaPendukung,
                mediaPerangkatLunak: rpsData.mediaPerangkatLunak, 
                mediaPerangkatKeras: rpsData.mediaPerangkatKeras, 
                dokumenRps: filePath 
            };

            if (existingRps) {
                await Rps.update(payload, {
                    where: { id: existingRps.id },
                    transaction: trx
                });
                return { isNewRecord: false, data: payload };
            } else {
                const newRps = await Rps.create(payload, { transaction: trx });
                return { isNewRecord: true, data: newRps };
            }
        });
    } catch (error) {
        throw new Error("Gagal menyimpan detail RPS: " + error.message);
    }
};

export const deleteDetailRps = async (id) => {
    try {
        const deletedRowsCount = await Rps.destroy({ where: { id: id } });
        return deletedRowsCount > 0;
    } catch (error) {
        throw new Error("Gagal menghapus detail RPS: " + error.message);
    }
};

// ==========================================
// --- BAGIAN RENCANA PEMBELAJARAN (HALAMAN 7) ---
// ==========================================
// export const getRencanaPembelajaran = async (mataKuliahId, periodeId = null) => {
//     try {
//         // 1. AMBIL DATA HEADER MATA KULIAH
//         const mk = await MataKuliah.findByPk(mataKuliahId, {
//             attributes: ['id', 'kode', 'nama', 'totalSks', 'jenis'],
//             include: [
//                 { model: ProgramStudi, as: 'programStudi', attributes: ['nama', 'siakJenjangId'] },
//                 { model: TahunKurikulum, as: 'tahunKurikulum', attributes: ['tahun'] }
//             ]
//         });

//         if (!mk) throw new Error("Mata Kuliah tidak ditemukan");

//         // Trik Bypass Jenjang untuk Unit Pengampu
//         let teksUnitPengampu = '-';
//         if (mk.programStudi) {
//             let namaJenjang = 'S1'; 
//             if (mk.programStudi.siakJenjangId) {
//                 const jenjang = await Jenjang.findByPk(mk.programStudi.siakJenjangId);
//                 if (jenjang) namaJenjang = jenjang.jenjang; 
//             }
//             teksUnitPengampu = `${namaJenjang} - ${mk.programStudi.nama}`;
//         }

//         const formattedMk = {
//             id: mk.id,
//             kode: mk.kode,
//             nama: mk.nama,
//             totalSks: mk.totalSks,
//             jenis: mk.jenis || '-',
//             tahunKurikulum: mk.tahunKurikulum ? mk.tahunKurikulum.tahun : '-',
//             unitPengampu: teksUnitPengampu
//         };

//         // 2. AMBIL DAFTAR PERIODE (Untuk Dropdown Filter di UI)
//         const daftarPeriode = await PeriodeAkademik.findAll({
//             attributes: ['id', 'nama', 'status'],
//             order: [['tanggal_mulai', 'DESC']]
//         });

//         // 3. AMBIL MASTER CPMK (Untuk Checkbox di Modal Tambah Sesi)
//         const masterCpmk = await models.CapaianMataKuliah.findAll({
//             where: { siakMataKuliahId: mataKuliahId },
//             attributes: ['id', 'kode', 'deskripsi'],
//             order: [['kode', 'ASC']]
//         });

//         // 4. AMBIL DATA SESI (RENCANA PEMBELAJARAN)
//         let whereClause = { siakMataKuliahId: mataKuliahId };
//         if (periodeId) {
//             whereClause.siakPeriodeAkademikId = periodeId;
//         }

//         const listSesi = await RencanaPembelajaran.findAll({
//             where: whereClause,
//             order: [['sesi', 'ASC']],
//             // Kita ambil include ke pivot CPMK
//             include: [{
//                 model: models.PemetaanPembelajaranCpmk,
//                 as: 'pemetaanCpmk',
//                 include: [{
//                     model: models.CapaianMataKuliah,
//                     as: 'cpmk',
//                     attributes: ['id', 'kode', 'deskripsi']
//                 }]
//             }]
//         });

//         // 5. MAPPING DATA SESI AGAR BERSIH & SESUAI UI
//         const formattedSesi = listSesi.map(sesi => {
//             const s = sesi.toJSON();
            
//             // Ekstrak CPMK yang dichecklist pada sesi ini
//             const cpmkTerpilih = (s.pemetaanCpmk || []).map(p => ({
//                 id: p.cpmk?.id,
//                 kode: p.cpmk?.kode,
//                 deskripsi: p.cpmk?.deskripsi
//             })).filter(c => c.id); // Buang jika data CPMK tidak ditemukan

//             return {
//                 id: s.id,
//                 siakPeriodeAkademikId: s.siakPeriodeAkademikId,
//                 sesi: s.sesi,
//                 jenisPertemuan: s.jenisPertemuan,
//                 materiPembelajaran: s.materiPembelajaran,
//                 materiPembelajaranEng: s.materiPembelajaranEng,
//                 indikatorPenilaian: s.indikatorPenilaian,
//                 kriteriaPenilaian: s.kriteriaPenilaian,
//                 // Mapping eksplisit agar tidak ada field null/redundant
//                 metodeLuring: s.metodePembelajaranLuring,
//                 metodeDaring: s.metodePembelajaranDaring,
//                 bobotPenilaian: parseFloat(s.bobotPenilaian || 0),
//                 // Data CPMK yang dichecklist
//                 cpmkTerpilih: cpmkTerpilih
//             };
//         });

//         // RETURN OBJECT FINAL UNTUK FRONTEND
//         return {
//             mataKuliah: formattedMk,
//             daftarPeriode: daftarPeriode,
//             masterCpmk: masterCpmk,
//             rencanaData: formattedSesi
//         };

//     } catch (error) {
//         throw new Error(`Gagal memuat Rencana Pembelajaran: ${error.message}`);
//     }
// };
export const getRencanaPembelajaran = async (mkId, periodeId) => {
    const header = await getHeaderMk(mkId);
    const daftarPeriode = await PeriodeAkademik.findAll({ order: [['tanggal_mulai', 'DESC']] });
    let targetPeriodeId = periodeId || (daftarPeriode.find(p => p.status === 'Aktif') || daftarPeriode[0])?.id;

    // 1. MASTER CPMK (Dibikin Hirarki untuk Form Checkbox)
    const rawCpmk = await CapaianMataKuliah.findAll({
        where: { siakMataKuliahId: mkId },
        attributes: ['id', 'kode', 'deskripsi', 'parent_id'],
        order: [['kode', 'ASC']]
    });

    const cpmkItems = rawCpmk.map(c => c.toJSON());
    const masterCpmk = cpmkItems.filter(c => !c.parent_id).map(parent => ({
        ...parent,
        subCpmk: cpmkItems.filter(sub => sub.parent_id === parent.id)
    }));

    // 2. DATA SESI (TABEL UTAMA)
    const rencana = await RencanaPembelajaran.findAll({
        where: { siakMataKuliahId: mkId, siakPeriodeAkademikId: targetPeriodeId },
        include: [{ 
            model: models.PemetaanPembelajaranCpmk, as: 'pemetaanCpmk',
            include: [{ 
                model: CapaianMataKuliah, as: 'cpmk', 
                attributes: ['id', 'kode', 'deskripsi', 'parent_id'] 
            }]
        }],
        order: [['sesi', 'ASC']]
    });

    const formattedRencana = rencana.map(r => {
        const item = r.toJSON();
        const listCpmk = (item.pemetaanCpmk || []).map(p => p.cpmk).filter(Boolean);
        
        // Cek CPMK terpilih (Bisa Induk langsung atau Sub-nya)
        const cpmkTerpilihIds = listCpmk.map(c => c.id);
        
        // Bentuk hirarki untuk di tabel list Sesi
        const cpmkTerpilih = cpmkItems.filter(c => !c.parent_id && cpmkTerpilihIds.includes(c.id)).map(parent => ({
            ...parent,
            subCpmk: cpmkItems.filter(sub => sub.parent_id === parent.id && cpmkTerpilihIds.includes(sub.id))
        }));

        // Antisipasi: Kalau yang dipilih CUMA sub-nya (induk gak di-ceklis), kita tetep tampilin induknya di atasnya
        listCpmk.filter(c => c.parent_id).forEach(sub => {
            const isParentAlreadyIncluded = cpmkTerpilih.find(p => p.id === sub.parent_id);
            if (!isParentAlreadyIncluded) {
                const theParent = cpmkItems.find(c => c.id === sub.parent_id);
                if (theParent) {
                    cpmkTerpilih.push({
                        ...theParent,
                        subCpmk: [sub]
                    });
                }
            }
        });

        return {
            id: item.id,
            siakPeriodeAkademikId: item.siakPeriodeAkademikId,
            sesi: item.sesi,
            jenisPertemuan: item.jenisPertemuan,
            materiPembelajaran: item.materiPembelajaran,
            materiPembelajaranEng: item.materiPembelajaranEng,
            indikatorPenilaian: item.indikatorPenilaian,
            kriteriaPenilaian: item.kriteriaPenilaian, // Bentuk & Kriteria Penilaian
            metodePembelajaranLuring: item.metodePembelajaranLuring,
            metodePembelajaranDaring: item.metodePembelajaranDaring,
            bobotPenilaian: parseFloat(item.bobotPenilaian || 0),
            cpmkTerpilih: cpmkTerpilih,
            cpmkIdsFlat: cpmkTerpilihIds // Ini berguna buat narik data pas Edit di FE
        };
    });

    return {
        mataKuliah: header,
        daftarPeriode,
        masterCpmk, // <-- Formatnya sudah Hirarki [ { id: 'parent1', subCpmk: [ {id: 'sub1'} ] } ]
        rencanaData: formattedRencana,
        periodeTerpilihId: targetPeriodeId
    };
};
// export const createRencanaPembelajaran = async (mataKuliahId, payload) => {
//     // Pakai transaction karena kita insert ke 2 tabel (tabel utama & tabel pivot CPMK)
//     const trx = await sequelize.transaction();
//     try {
//         // 1. Simpan data form utama
//         const newData = await RencanaPembelajaran.create({
//             siakMataKuliahId: mataKuliahId,
//             siakPeriodeAkademikId: payload.siakPeriodeAkademikId, 
//             sesi: payload.sesi,
//             jenisPertemuan: payload.jenisPertemuan,
//             materiPembelajaran: payload.materiPembelajaran,
//             materiPembelajaranEng: payload.materiPembelajaranEng,
//             indikatorPenilaian: payload.indikatorPenilaian,
//             kriteriaPenilaian: payload.kriteriaPenilaian,
//             metodePembelajaranLuring: payload.metodePembelajaranLuring,
//             metodePembelajaranDaring: payload.metodePembelajaranDaring,
//             bobotPenilaian: payload.bobotPenilaian || 0
//         }, { transaction: trx });

//         // 2. Simpan Mapping CPMK (Checkbox) ke tabel pivot
//         if (payload.cpmkIds && Array.isArray(payload.cpmkIds) && payload.cpmkIds.length > 0) {
//             const pemetaanData = payload.cpmkIds.map(cpmkId => ({
//                 siakRencanaPembelajaranId: newData.id,
//                 siakCpmkId: cpmkId
//             }));
            
//             // Panggil model pivot yang udah kita buat tadi
//             await models.PemetaanPembelajaranCpmk.bulkCreate(pemetaanData, { transaction: trx });
//         }

//         await trx.commit(); // Eksekusi query!
        
//         // Return data yang baru dibuat
//         return newData;
//     } catch (error) {
//         await trx.rollback(); // Batalkan kalau gagal
//         throw new Error("Gagal menambah Rencana Pembelajaran: " + error.message);
//     }
// };

// export const updateRencanaPembelajaran = async (id, payload) => {
//     try {
//         await RencanaPembelajaran.update(payload, { where: { id: id } });
//         return await RencanaPembelajaran.findByPk(id, {
//             attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] }
//         });
//     } catch (error) {
//         throw new Error("Gagal mengupdate Rencana Pembelajaran: " + error.message);
//     }
// };

export const createRencanaPembelajaran = async (mkId, payload) => {
    return await sequelize.transaction(async (t) => {
        // Validasi bobot per sesi tidak boleh melebihi 100
        const bobotSesi = parseFloat(payload.bobotPenilaian || 0);
        if (bobotSesi > 100) throw new CustomError.BadRequestError(`Bobot per sesi tidak boleh lebih dari 100%. Input: ${bobotSesi}%.`);

        const sesiBaru = await RencanaPembelajaran.create({
            siakMataKuliahId: mkId,
            siakPeriodeAkademikId: payload.siakPeriodeAkademikId,
            sesi: payload.sesi,
            jenisPertemuan: payload.jenisPertemuan,
            materiPembelajaran: payload.materiPembelajaran,
            materiPembelajaranEng: payload.materiPembelajaranEng,
            indikatorPenilaian: payload.indikatorPenilaian,
            kriteriaPenilaian: payload.kriteriaPenilaian,
            metodePembelajaranLuring: payload.metodePembelajaranLuring,
            metodePembelajaranDaring: payload.metodePembelajaranDaring,
            bobotPenilaian: payload.bobotPenilaian || 0
        }, { transaction: t });

        if (payload.cpmkIds?.length > 0) {
            const pivotData = payload.cpmkIds.map(id => ({ siakRencanaPembelajaranId: sesiBaru.id, siakCpmkId: id }));
            await models.PemetaanPembelajaranCpmk.bulkCreate(pivotData, { transaction: t });
        }

        return sesiBaru;
    });
};

// =========================================================
// DETAIL 1 Sesi Rencana Pembelajaran (by ID)
// =========================================================
export const getDetailRencanaPembelajaran = async (id) => {
    const sesi = await RencanaPembelajaran.findByPk(id, {
        include: [
            { model: MataKuliah, as: 'mataKuliah', attributes: ['id', 'kode', 'nama'] },
            { model: PeriodeAkademik, as: 'periode', attributes: ['id', 'nama'] },
            {
                model: models.PemetaanPembelajaranCpmk, as: 'pemetaanCpmk',
                include: [{ model: CapaianMataKuliah, as: 'cpmk', attributes: ['id', 'kode', 'deskripsi', 'parent_id'] }]
            }
        ]
    });
    if (!sesi) throw new CustomError.NotFoundError("Data sesi tidak ditemukan");

    const sesiJson = sesi.toJSON();
    const listCpmk = (sesiJson.pemetaanCpmk || []).map(p => p.cpmk).filter(Boolean);
    const cpmkTerpilihIds = listCpmk.map(c => c.id);

    // Susun hirarki Induk -> Sub (mirip format di list), supaya FE bisa render checkbox terisi
    const allCpmkMk = await CapaianMataKuliah.findAll({
        where: { siakMataKuliahId: sesi.siakMataKuliahId },
        attributes: ['id', 'kode', 'deskripsi', 'parent_id']
    });
    const cpmkItems = allCpmkMk.map(c => c.toJSON());
    const cpmkTerpilih = cpmkItems.filter(c => !c.parent_id && cpmkTerpilihIds.includes(c.id)).map(parent => ({
        ...parent,
        subCpmk: cpmkItems.filter(sub => sub.parent_id === parent.id && cpmkTerpilihIds.includes(sub.id))
    }));
    listCpmk.filter(c => c.parent_id).forEach(sub => {
        const isParentAlreadyIncluded = cpmkTerpilih.find(p => p.id === sub.parent_id);
        if (!isParentAlreadyIncluded) {
            const theParent = cpmkItems.find(c => c.id === sub.parent_id);
            if (theParent) cpmkTerpilih.push({ ...theParent, subCpmk: [sub] });
        }
    });

    return {
        id: sesi.id,
        mataKuliah: sesi.mataKuliah,
        periode: sesi.periode,
        sesi: sesi.sesi,
        jenisPertemuan: sesi.jenisPertemuan,
        materiPembelajaran: sesi.materiPembelajaran,
        materiPembelajaranEng: sesi.materiPembelajaranEng,
        indikatorPenilaian: sesi.indikatorPenilaian,
        kriteriaPenilaian: sesi.kriteriaPenilaian,
        metodePembelajaranLuring: sesi.metodePembelajaranLuring,
        metodePembelajaranDaring: sesi.metodePembelajaranDaring,
        bobotPenilaian: parseFloat(sesi.bobotPenilaian || 0),
        cpmkTerpilih,
        cpmkIdsFlat: cpmkTerpilihIds
    };
};

export const updateRencanaPembelajaran = async (id, payload, mkId) => {
    return await sequelize.transaction(async (t) => {
        const sesi = await RencanaPembelajaran.findByPk(id, { transaction: t });
        if (!sesi) throw new CustomError.NotFoundError("Data sesi tidak ditemukan");

        // Validasi 100% Bobot (Kecualikan ID yang sedang diupdate)
        const existingSesi = await RencanaPembelajaran.findAll({
            where: {
                siakMataKuliahId: sesi.siakMataKuliahId,
                siakPeriodeAkademikId: payload.siakPeriodeAkademikId,
                id: { [Op.ne]: id } // Kecualikan sesi ini sendiri
            },
            transaction: t
        });
        const totalBobotLain = existingSesi.reduce((acc, curr) => acc + parseFloat(curr.bobotPenilaian || 0), 0);
        const totalBaru = totalBobotLain + parseFloat(payload.bobotPenilaian || 0);

        if (totalBaru > 100) throw new CustomError.BadRequestError(`Gagal Update! Total seluruh bobot akan menjadi ${totalBaru}%. Batas maksimal 100%.`);

        // Eksekusi Update
        await sesi.update({
            sesi: payload.sesi,
            jenisPertemuan: payload.jenisPertemuan,
            materiPembelajaran: payload.materiPembelajaran,
            materiPembelajaranEng: payload.materiPembelajaranEng,
            indikatorPenilaian: payload.indikatorPenilaian,
            kriteriaPenilaian: payload.kriteriaPenilaian,
            metodePembelajaranLuring: payload.metodePembelajaranLuring,
            metodePembelajaranDaring: payload.metodePembelajaranDaring,
            bobotPenilaian: payload.bobotPenilaian || 0
        }, { transaction: t });

        // Update Pivot
        if (payload.cpmkIds) {
            await models.PemetaanPembelajaranCpmk.destroy({ where: { siakRencanaPembelajaranId: id }, transaction: t });
            const pivotData = payload.cpmkIds.map(cId => ({ siakRencanaPembelajaranId: id, siakCpmkId: cId }));
            await models.PemetaanPembelajaranCpmk.bulkCreate(pivotData, { transaction: t });
        }

        return true;
    });
};
export const deleteRencanaPembelajaran = async (id) => {
    return await sequelize.transaction(async (t) => {
        // Hapus pivotnya dulu biar bersih
        await models.PemetaanPembelajaranCpmk.destroy({ where: { siakRencanaPembelajaranId: id }, transaction: t });
        // Hapus utamanya
        const deleted = await RencanaPembelajaran.destroy({ where: { id }, transaction: t });
        if (deleted === 0) throw new CustomError.NotFoundError("Data tidak ditemukan");
        return true;
    });
};

// Daftar kode+deskripsi CPMK (Induk & Sub) milik 1 MK -- untuk sheet referensi di template Excel
export const getDaftarCpmkUntukTemplate = async (mkId) => {
    const list = await CapaianMataKuliah.findAll({
        where: { siakMataKuliahId: mkId },
        attributes: ['kode', 'deskripsi'],
        order: [['kode', 'ASC']]
    });
    return list.map(c => ({ kode: c.kode, deskripsi: c.deskripsi }));
};

// =========================================================
// PRATINJAU SALIN Rencana Pembelajaran (lihat isi periode asal sebelum disalin)
// =========================================================
export const pratinjauSalinRencanaPembelajaran = async (mkId, periodeAsalId) => {
    const rencana = await RencanaPembelajaran.findAll({
        where: { siakMataKuliahId: mkId, siakPeriodeAkademikId: periodeAsalId },
        include: [{
            model: models.PemetaanPembelajaranCpmk, as: 'pemetaanCpmk',
            include: [{ model: CapaianMataKuliah, as: 'cpmk', attributes: ['kode'] }]
        }],
        order: [['sesi', 'ASC']]
    });
    if (rencana.length === 0) throw new CustomError.NotFoundError("Rencana Pembelajaran pada periode asal belum diisi");

    const periodeAsal = await PeriodeAkademik.findByPk(periodeAsalId, { attributes: ['nama'] });

    return {
        periodeAsal: periodeAsal?.nama || '-',
        jumlahSesi: rencana.length,
        sesi: rencana.map(r => ({
            sesi: r.sesi,
            jenisPertemuan: r.jenisPertemuan,
            materiPembelajaran: r.materiPembelajaran,
            bobotPenilaian: parseFloat(r.bobotPenilaian || 0),
            cpmk: (r.pemetaanCpmk || []).map(p => p.cpmk?.kode).filter(Boolean)
        }))
    };
};

// =========================================================
// SALIN Rencana Pembelajaran antar Periode (wipe & replace periode tujuan)
// CPMK id tetap sama (milik MK, bukan milik periode), jadi pemetaan CPMK
// ikut tersalin langsung tanpa perlu translasi kode->id.
// =========================================================
export const salinRencanaPembelajaran = async (mkId, periodeAsalId, periodeTujuanId) => {
    if (periodeAsalId === periodeTujuanId) {
        throw new CustomError.BadRequestError("Periode asal dan tujuan tidak boleh sama");
    }

    const rencanaAsal = await RencanaPembelajaran.findAll({
        where: { siakMataKuliahId: mkId, siakPeriodeAkademikId: periodeAsalId },
        include: [{ model: models.PemetaanPembelajaranCpmk, as: 'pemetaanCpmk', attributes: ['siakCpmkId'] }],
        order: [['sesi', 'ASC']]
    });
    if (rencanaAsal.length === 0) throw new CustomError.NotFoundError("Rencana Pembelajaran pada periode asal belum diisi");

    return await sequelize.transaction(async (t) => {
        // Wipe data lama di periode tujuan
        const existingTujuan = await RencanaPembelajaran.findAll({
            where: { siakMataKuliahId: mkId, siakPeriodeAkademikId: periodeTujuanId },
            attributes: ['id'], transaction: t
        });
        const existingIds = existingTujuan.map(e => e.id);
        if (existingIds.length > 0) {
            await models.PemetaanPembelajaranCpmk.destroy({ where: { siakRencanaPembelajaranId: existingIds }, force: true, transaction: t });
            await RencanaPembelajaran.destroy({ where: { id: existingIds }, force: true, transaction: t });
        }

        // Insert ulang dari periode asal
        for (const sesiAsal of rencanaAsal) {
            const sesiBaru = await RencanaPembelajaran.create({
                siakMataKuliahId: mkId,
                siakPeriodeAkademikId: periodeTujuanId,
                sesi: sesiAsal.sesi,
                jenisPertemuan: sesiAsal.jenisPertemuan,
                materiPembelajaran: sesiAsal.materiPembelajaran,
                materiPembelajaranEng: sesiAsal.materiPembelajaranEng,
                indikatorPenilaian: sesiAsal.indikatorPenilaian,
                kriteriaPenilaian: sesiAsal.kriteriaPenilaian,
                metodePembelajaranLuring: sesiAsal.metodePembelajaranLuring,
                metodePembelajaranDaring: sesiAsal.metodePembelajaranDaring,
                bobotPenilaian: sesiAsal.bobotPenilaian
            }, { transaction: t });

            const cpmkIds = (sesiAsal.pemetaanCpmk || []).map(p => p.siakCpmkId);
            if (cpmkIds.length > 0) {
                await models.PemetaanPembelajaranCpmk.bulkCreate(
                    cpmkIds.map(id => ({ siakRencanaPembelajaranId: sesiBaru.id, siakCpmkId: id })),
                    { transaction: t }
                );
            }
        }

        return { jumlahDisalin: rencanaAsal.length };
    });
};

// =========================================================
// IMPORT EXCEL: Tambah banyak data Rencana Pembelajaran sekaligus
// (APPEND -- tidak menghapus data sesi yang sudah ada, sesuai keterangan
// modal "Gunakan template ini untuk MENAMBAHKAN banyak data sekaligus")
// =========================================================
export const importRencanaPembelajaran = async (mkId, periodeId, rows) => {
    if (!rows || rows.length === 0) throw new CustomError.BadRequestError("Tidak ada baris data pada file yang diunggah");

    // 1. Validasi total bobot (data lama + data baru) tidak boleh lebih dari 100%
    const existingSesi = await RencanaPembelajaran.findAll({
        where: { siakMataKuliahId: mkId, siakPeriodeAkademikId: periodeId },
        attributes: ['bobotPenilaian']
    });
    const totalBobotLama = existingSesi.reduce((sum, s) => sum + parseFloat(s.bobotPenilaian || 0), 0);
    const totalBobotBaru = rows.reduce((sum, r) => sum + parseFloat(r.bobotPenilaian || 0), 0);
    const totalKeseluruhan = totalBobotLama + totalBobotBaru;
    if (totalKeseluruhan > 100) {
        throw new CustomError.BadRequestError(
            `Total bobot akan menjadi ${totalKeseluruhan}% (data lama ${totalBobotLama}% + data baru ${totalBobotBaru}%). Tidak boleh lebih dari 100%!`
        );
    }

    // 2. Siapkan kamus kode CPMK -> id (Induk + Sub) milik MK ini, untuk resolve kolom "CPMK & Sub-CPMK"
    const allCpmk = await CapaianMataKuliah.findAll({
        where: { siakMataKuliahId: mkId },
        attributes: ['id', 'kode']
    });
    const cpmkIdByKode = new Map(allCpmk.map(c => [String(c.kode).trim().toUpperCase(), c.id]));

    return await sequelize.transaction(async (t) => {
        const detailImport = [];

        for (const row of rows) {
            const kodeCpmkList = (row.cpmkKodeList || []).map(k => String(k).trim()).filter(Boolean);
            const cpmkIds = [];
            const kodeTidakDitemukan = [];
            kodeCpmkList.forEach(kode => {
                const id = cpmkIdByKode.get(kode.toUpperCase());
                if (id) cpmkIds.push(id);
                else kodeTidakDitemukan.push(kode);
            });

            const sesiBaru = await RencanaPembelajaran.create({
                siakMataKuliahId: mkId,
                siakPeriodeAkademikId: periodeId,
                sesi: row.sesi,
                jenisPertemuan: row.jenisPertemuan,
                materiPembelajaran: row.materiPembelajaran,
                materiPembelajaranEng: row.materiPembelajaranEng,
                indikatorPenilaian: row.indikatorPenilaian,
                kriteriaPenilaian: row.kriteriaPenilaian,
                metodePembelajaranLuring: row.metodePembelajaranLuring,
                metodePembelajaranDaring: row.metodePembelajaranDaring,
                bobotPenilaian: row.bobotPenilaian || 0
            }, { transaction: t });

            if (cpmkIds.length > 0) {
                await models.PemetaanPembelajaranCpmk.bulkCreate(
                    cpmkIds.map(id => ({ siakRencanaPembelajaranId: sesiBaru.id, siakCpmkId: id })),
                    { transaction: t }
                );
            }

            detailImport.push({
                sesi: row.sesi,
                jumlahCpmkDipetakan: cpmkIds.length,
                kodeCpmkTidakDitemukan: kodeTidakDitemukan
            });
        }

        return { jumlahDiimport: rows.length, detail: detailImport };
    });
};


// export const deleteRencanaPembelajaran = async (id) => {
//     try {
//         const deletedRows = await RencanaPembelajaran.destroy({ where: { id: id } });
//         return deletedRows > 0;
//     } catch (error) {
//         throw new Error("Gagal menghapus Rencana Pembelajaran: " + error.message);
//     }
// };

export const getRencanaEvaluasi = async (mataKuliahId, periodeId = null) => {
    try {
        // A. Data Header MK
        const mk = await MataKuliah.findByPk(mataKuliahId, {
            attributes: ['id', 'kode', 'nama', 'totalSks', 'jenis'],
            include: [
                { model: ProgramStudi, as: 'programStudi', attributes: ['nama', 'siakJenjangId'] },
                { model: TahunKurikulum, as: 'tahunKurikulum', attributes: ['tahun'] }
            ]
        });

        if (!mk) throw new CustomError.NotFoundError("Mata Kuliah tidak ditemukan");

        // B. Daftar Periode & Tentukan Periode Terpilih
        const daftarPeriode = await PeriodeAkademik.findAll({ attributes: ['id', 'nama', 'status'], order: [['tanggal_mulai', 'DESC']] });
        
        // Jika periodeId null, cari yang statusnya 'Aktif', jika tidak ada ambil yang paling baru
        let targetPeriodeId = periodeId || (daftarPeriode.find(p => p.status === 'Aktif') || daftarPeriode[0])?.id;

        const evaluasiExist = await models.RencanaEvaluasi.findAll({ 
            where: { siakMataKuliahId: mataKuliahId }, 
            attributes: ['siakPeriodeAkademikId'] 
        });
        const listPeriodeAdaData = evaluasiExist.map(e => e.siakPeriodeAkademikId);

        // C. Master CPMK (Hirarki untuk Kolom Tabel Matriks Evaluasi)
        const rawCpmk = await models.CapaianMataKuliah.findAll({
            where: { siakMataKuliahId: mataKuliahId },
            attributes: ['id', 'kode', 'deskripsi', 'parent_id'], // Sesuaikan parent_id/parentId dengan model Abang
            order: [['kode', 'ASC']]
        });

        const items = rawCpmk.map(c => c.toJSON());
        const masterCpmkHierarki = items.filter(i => !i.parent_id).map(parent => ({
            ...parent,
            subCpmk: items.filter(sub => sub.parent_id === parent.id)
        }));

        // D. Data Komponen Evaluasi
        const evaluasiData = await models.RencanaEvaluasi.findAll({
            where: { 
                siakMataKuliahId: mataKuliahId, 
                siakPeriodeAkademikId: targetPeriodeId 
            },
            include: [{
                model: models.PemetaanEvaluasiCpmk,
                as: 'pemetaanCpmk'
            }]
        });

        // E. Mapping untuk Frontend
        const formattedEvaluasi = evaluasiData.map(ev => {
            const e = ev.toJSON();
            const mappingBobot = {};

            // Key by siakCpmkId langsung (kolom FK di pivot), bukan via include
            // capaianMataKuliah -- include itu null kalau CPMK master-nya sudah
            // soft-deleted, padahal pivot-nya sendiri masih valid.
            (e.pemetaanCpmk || []).forEach(p => {
                mappingBobot[p.siakCpmkId] = parseFloat(p.bobotCpmk || 0);
            });

            return {
                id: e.id,
                siakPeriodeAkademikId: e.siakPeriodeAkademikId,
                metodeEvaluasi: e.metodeEvaluasi,
                jenisEvaluasi: e.jenisEvaluasi,
                bobotEvaluasi: parseFloat(e.bobot || 0),
                syaratLulus: e.syaratLulus || 'TIDAK_MENJADI_SYARAT_LULUS',
                deskripsi: e.deskripsi,
                deskripsiInggris: e.deskripsiInggris,
                mappingBobotCpmk: mappingBobot 
            };
        });

        return {
            mataKuliah: { 
                ...mk.toJSON(), 
                unitPengampu: `S1 - ${mk.programStudi?.nama || '-'}`, 
                tahunKurikulum: mk.tahunKurikulum?.tahun || '-' 
            },
            daftarPeriode: daftarPeriode.map(p => ({ 
                ...p.toJSON(), 
                adaData: listPeriodeAdaData.includes(p.id) 
            })),
            masterCpmk: masterCpmkHierarki, // 👈 Sudah diperbaiki panggilannya
            rencanaEvaluasi: formattedEvaluasi,
            periodeTerpilihId: targetPeriodeId
        };
    } catch (error) { 
        throw new Error(error.message); 
    }
};
export const saveRencanaEvaluasi = async (mkId, payload) => {
    const { siakPeriodeAkademikId, evaluasiList } = payload;
    let totalBobotKeseluruhan = 0;

    // ----------------------------------------------------------------
    // 🚨 BLOK VALIDASI LEVEL CPMK (Konsistensi dengan form Pemetaan CPMK)
    // Kolom CPMK yang dipilih di sini (untuk diisi bobotCpmk) harus sama
    // levelnya dengan `levelPemetaan` yang diset di form Pemetaan CPMK MK
    // ini -- supaya monitoring CPL (yang JOIN ke siak_pemetaan_cpl_cpmk
    // berdasarkan level itu) tidak kehilangan data secara senyap.
    // ----------------------------------------------------------------
    const semuaCpmkIdDipakai = [...new Set(
        evaluasiList.flatMap(row => (row.cpmkData || []).map(c => c.siakCpmkId || c.cpmkId).filter(Boolean))
    )];

    if (semuaCpmkIdDipakai.length > 0) {
        const mk = await MataKuliah.findByPk(mkId, { attributes: ['levelPemetaan'] });
        const levelPemetaan = mk?.levelPemetaan || 'CPMK';

        const cpmkRows = await CapaianMataKuliah.findAll({
            where: { id: semuaCpmkIdDipakai },
            attributes: ['id', 'kode', 'parentId']
        });
        const cpmkMap = new Map(cpmkRows.map(c => [c.id, c]));

        for (const cpmkId of semuaCpmkIdDipakai) {
            const cpmk = cpmkMap.get(cpmkId);
            if (!cpmk) continue; // biarkan lolos kalau memang tidak ditemukan (kasus lain yang sudah ditangani terpisah)

            const adalahSub = !!cpmk.parentId;
            if (levelPemetaan === 'Sub-CPMK' && !adalahSub) {
                throw new CustomError.BadRequestError(`Mata kuliah ini memetakan CPL di level Sub-CPMK, tapi kolom "${cpmk.kode}" yang dipilih di Rencana Evaluasi adalah CPMK Induk. Pilih Sub-CPMK-nya, atau ubah Level Pemetaan di form Pemetaan CPMK.`);
            }
            if (levelPemetaan !== 'Sub-CPMK' && adalahSub) {
                throw new CustomError.BadRequestError(`Mata kuliah ini memetakan CPL di level CPMK Induk, tapi kolom "${cpmk.kode}" yang dipilih di Rencana Evaluasi adalah Sub-CPMK. Pilih CPMK Induknya, atau ubah Level Pemetaan ke 'Sub-CPMK' di form Pemetaan CPMK.`);
            }
        }
    }

    // ----------------------------------------------------------------
    // 🚨 BLOK VALIDASI MATEMATIKA (Sesuai UI)
    // ----------------------------------------------------------------
    evaluasiList.forEach((row, index) => {
        const barisKe = index + 1;
        let totalBobotHorizontal = 0;

        // 1. Hitung total sebaran bobot CPMK per baris
        if (row.cpmkData && row.cpmkData.length > 0) {
            row.cpmkData.forEach(cpmk => {
                totalBobotHorizontal += parseFloat(cpmk.bobotCpmk || 0);
            });

            // Pastikan jumlah sebaran CPMK == Bobot Evaluasi baris tersebut
            // Pakai toFixed(2) untuk menghindari bug desimal Javascript (misal: 34.999999)
            if (totalBobotHorizontal.toFixed(2) !== parseFloat(row.bobotEvaluasi).toFixed(2)) {
                throw new CustomError.BadRequestError(`Gagal! Pada baris ke-${barisKe} (${row.metodeEvaluasi}), total sebaran CPMK (${totalBobotHorizontal.toFixed(2)}%) tidak sama dengan Bobot Evaluasi (${row.bobotEvaluasi}%).`);
            }
        }

        totalBobotKeseluruhan += parseFloat(row.bobotEvaluasi || 0);
    });

    // 2. Pastikan total keseluruhan baris dari atas ke bawah = 100%
    if (Math.round(totalBobotKeseluruhan) !== 100) {
        throw new CustomError.BadRequestError(`Gagal! Total Persentase Komponen Evaluasi adalah ${totalBobotKeseluruhan}%. Wajib tepat 100%!`);
    }

    // ----------------------------------------------------------------
    // 💾 BLOK DATABASE: UPSERT-IN-PLACE
    // (id RencanaEvaluasi dipertahankan untuk baris yang masih ada, supaya
    //  siak_nilai_evaluasi_mahasiswa.siak_rencana_evaluasi_id yang sudah
    //  terisi nilai mahasiswa tidak jadi orphan setiap kali RPS diedit)
    // ----------------------------------------------------------------
    const normalizeMapping = (pairs) => JSON.stringify(
        pairs
            .map(([cpmkId, bobot]) => [cpmkId, Math.round(parseFloat(bobot || 0) * 100)])
            .sort((a, b) => a[0].localeCompare(b[0]))
    );

    const changedRencanaEvaluasiIds = await sequelize.transaction(async (trx) => {
        // A. Ambil data lama untuk MK + periode ini, lengkap dengan pemetaan CPMK-nya
        const existingRows = await models.RencanaEvaluasi.findAll({
            where: { siakMataKuliahId: mkId, siakPeriodeAkademikId },
            include: [{ model: models.PemetaanEvaluasiCpmk, as: 'pemetaanCpmk' }],
            transaction: trx
        });

        const existingById = new Map(existingRows.map(r => [r.id, r]));
        const usedExistingIds = new Set();
        const changedIds = [];

        for (const row of evaluasiList) {
            // Cocokkan ke baris lama: prioritas via id (kalau FE kirim balik),
            // fallback via kombinasi metodeEvaluasi + jenisEvaluasi
            let matched = null;
            if (row.id && existingById.has(row.id) && !usedExistingIds.has(row.id)) {
                matched = existingById.get(row.id);
            }
            if (!matched) {
                matched = existingRows.find(r =>
                    !usedExistingIds.has(r.id) &&
                    (r.metodeEvaluasi || '').trim().toLowerCase() === (row.metodeEvaluasi || '').trim().toLowerCase() &&
                    (r.jenisEvaluasi || '').trim().toLowerCase() === (row.jenisEvaluasi || '').trim().toLowerCase()
                );
            }

            const newMappingPairs = (row.cpmkData || []).map(c => [c.siakCpmkId || c.cpmkId, c.bobotCpmk]);
            // Hanya timpa pemetaan CPMK kalau payload memang membawa data baru.
            // cpmkData kosong/tidak dikirim TIDAK dianggap "hapus semua mapping" --
            // pemetaan lama dipertahankan (mencegah hilang gara-gara FE kirim
            // baris tanpa cpmkData, mis. akibat bug GET yang tidak menyertakan
            // CPMK yang master-nya sudah soft-deleted).
            const willUpdateMapping = newMappingPairs.length > 0;

            if (matched) {
                usedExistingIds.add(matched.id);

                const bobotBerubah = Math.round(parseFloat(matched.bobot || 0) * 100) !== Math.round(parseFloat(row.bobotEvaluasi || 0) * 100);
                const oldMappingPairs = (matched.pemetaanCpmk || []).map(p => [p.siakCpmkId, p.bobotCpmk]);
                const mappingBerubah = willUpdateMapping && normalizeMapping(oldMappingPairs) !== normalizeMapping(newMappingPairs);

                await matched.update({
                    metodeEvaluasi: row.metodeEvaluasi,
                    jenisEvaluasi: row.jenisEvaluasi,
                    bobot: row.bobotEvaluasi,
                    deskripsi: row.deskripsi || '-',
                    deskripsiInggris: row.deskripsiInggris || '-',
                    syaratLulus: row.syaratLulus || 'TIDAK_MENJADI_SYARAT_LULUS'
                }, { transaction: trx });

                // Refresh pemetaan CPMK (id pivot tidak dirujuk tabel lain, aman destroy+recreate)
                if (willUpdateMapping) {
                    await models.PemetaanEvaluasiCpmk.destroy({ where: { siakRencanaEvaluasiId: matched.id }, transaction: trx });
                    await models.PemetaanEvaluasiCpmk.bulkCreate(
                        newMappingPairs.map(([cpmkId, bobotCpmk]) => ({
                            siakRencanaEvaluasiId: matched.id,
                            siakCpmkId: cpmkId,
                            bobotCpmk
                        })),
                        { transaction: trx }
                    );
                }

                if (bobotBerubah || mappingBerubah) {
                    changedIds.push(matched.id);
                }
            } else {
                // Baris baru
                const newEvaluasi = await models.RencanaEvaluasi.create({
                    siakMataKuliahId: mkId,
                    siakPeriodeAkademikId,
                    metodeEvaluasi: row.metodeEvaluasi,
                    jenisEvaluasi: row.jenisEvaluasi,
                    bobot: row.bobotEvaluasi,
                    deskripsi: row.deskripsi || '-',
                    deskripsiInggris: row.deskripsiInggris || '-',
                    syaratLulus: row.syaratLulus || 'TIDAK_MENJADI_SYARAT_LULUS' // Enum: 'TIDAK_MENJADI_SYARAT_LULUS' | 'MENJADI_SYARAT_LULUS' | 'LULUS_DENGAN_NILAI_MINIMUM'
                }, { transaction: trx });

                if (newMappingPairs.length > 0) {
                    await models.PemetaanEvaluasiCpmk.bulkCreate(
                        newMappingPairs.map(([cpmkId, bobotCpmk]) => ({
                            siakRencanaEvaluasiId: newEvaluasi.id,
                            siakCpmkId: cpmkId,
                            bobotCpmk
                        })),
                        { transaction: trx }
                    );
                }
            }
        }

        // B. Baris lama yang tidak muncul lagi di payload = mau dihapus koordinator.
        // Kalau sudah ada nilai mahasiswa yang menunjuk ke baris itu, tolak supaya
        // nilai mahasiswa tidak jadi orphan diam-diam.
        const removedRows = existingRows.filter(r => !usedExistingIds.has(r.id));
        if (removedRows.length > 0) {
            const removedIds = removedRows.map(r => r.id);
            const jumlahNilai = await models.NilaiEvaluasiMahasiswa.count({
                where: { siakRencanaEvaluasiId: { [Op.in]: removedIds } },
                transaction: trx
            });

            if (jumlahNilai > 0) {
                const namaKomponen = removedRows.map(r => r.metodeEvaluasi).join(', ');
                throw new CustomError.BadRequestError(`Komponen "${namaKomponen}" tidak bisa dihapus karena sudah ada nilai mahasiswa yang tercatat untuk komponen tersebut.`);
            }

            await models.PemetaanEvaluasiCpmk.destroy({ where: { siakRencanaEvaluasiId: { [Op.in]: removedIds } }, transaction: trx });
            await models.RencanaEvaluasi.destroy({ where: { id: { [Op.in]: removedIds } }, transaction: trx });
        }

        return changedIds;
    });

    // ----------------------------------------------------------------
    // 🔄 AUTO-RECALC: baris yang bobot/pemetaan CPMK-nya berubah dan sudah
    // punya nilai mahasiswa → hitung ulang nilai akhir & CPMK mahasiswa
    // yang statusnya belum dikunci/difinalisasi.
    // ----------------------------------------------------------------
    if (changedRencanaEvaluasiIds.length > 0) {
        const affected = await sequelize.query(`
            SELECT DISTINCT nem.siak_rincian_krs_mahasiswa_id AS krs_id
            FROM siak_nilai_evaluasi_mahasiswa nem
            JOIN siak_rincian_krs_mahasiswa rkm ON nem.siak_rincian_krs_mahasiswa_id = rkm.id
            WHERE nem.siak_rencana_evaluasi_id IN (:ids)
              AND nem.deleted_at IS NULL
              AND rkm.deleted_at IS NULL
              AND (rkm.status IS NULL OR rkm.status NOT IN ('Dikunci', 'Lulus', 'Tidak Lulus'))
        `, { replacements: { ids: changedRencanaEvaluasiIds }, type: sequelize.QueryTypes.SELECT });

        for (const row of affected) {
            try {
                await hitungNilaiAkhir(row.krs_id);
            } catch (err) {
                console.error(`Gagal recalc nilai akhir untuk krsId ${row.krs_id}:`, err.message);
            }
        }
    }

    return true;
};
export const deleteRencanaEvaluasi = async (id) => {
    try {
        // Soft-delete baris ini akan membuatnya tidak terlihat oleh semua query
        // Sequelize (default scope deleted_at IS NULL) -- termasuk include dari
        // siak_nilai_evaluasi_mahasiswa di hitungNilaiAkhir/getPesertaKelasList.
        // Kalau sudah ada nilai mahasiswa yang merujuk ke baris ini, nilai itu
        // akan terputus dari komponennya walau skor-nya sendiri tidak terhapus.
        const adaNilai = await models.NilaiEvaluasiMahasiswa.count({ where: { siakRencanaEvaluasiId: id } });
        if (adaNilai > 0) {
            throw new CustomError.BadRequestError("Tidak bisa menghapus: sudah ada nilai mahasiswa yang tersimpan untuk komponen evaluasi ini.");
        }
        const deleted = await models.RencanaEvaluasi.destroy({ where: { id } });
        return deleted > 0;
    } catch (error) {
        if (error instanceof CustomError.BadRequestError) throw error;
        throw new Error(error.message);
    }
};

// =========================================================
// PRATINJAU SALIN Rencana Evaluasi (lihat isi periode asal sebelum disalin)
// =========================================================
export const pratinjauSalinRencanaEvaluasi = async (mkId, periodeAsalId) => {
    const evaluasiAsal = await models.RencanaEvaluasi.findAll({
        where: { siakMataKuliahId: mkId, siakPeriodeAkademikId: periodeAsalId },
        include: [{
            model: models.PemetaanEvaluasiCpmk, as: 'pemetaanCpmk',
            include: [{ model: CapaianMataKuliah, as: 'capaianMataKuliah', attributes: ['kode'] }]
        }],
        order: [['createdAt', 'ASC']]
    });
    if (evaluasiAsal.length === 0) throw new CustomError.NotFoundError("Rencana Evaluasi pada periode asal belum diisi");

    const periodeAsal = await PeriodeAkademik.findByPk(periodeAsalId, { attributes: ['nama'] });
    let totalBobot = 0;

    const komponen = evaluasiAsal.map(e => {
        totalBobot += parseFloat(e.bobot || 0);
        return {
            metodeEvaluasi: e.metodeEvaluasi,
            jenisEvaluasi: e.jenisEvaluasi,
            bobotEvaluasi: parseFloat(e.bobot || 0),
            syaratLulus: e.syaratLulus,
            cpmk: (e.pemetaanCpmk || []).map(p => p.capaianMataKuliah?.kode).filter(Boolean)
        };
    });

    return {
        periodeAsal: periodeAsal?.nama || '-',
        totalBobot,
        komponen
    };
};

// =========================================================
// SALIN Rencana Evaluasi antar Periode (wipe & replace periode tujuan)
// CPMK id tetap sama (milik MK, bukan milik periode), jadi pemetaan CPMK
// ikut tersalin langsung tanpa perlu translasi kode->id.
// =========================================================
// Cek apakah ada nilai mahasiswa yang sudah tersimpan & merujuk ke baris
// RencanaEvaluasi tertentu. FK siak_nilai_evaluasi_mahasiswa.siak_rencana_evaluasi_id
// adalah ON DELETE SET NULL -- bukan RESTRICT -- jadi hard-delete baris
// RencanaEvaluasi TIDAK akan error, tapi diam-diam memutus nilai mahasiswa
// yang sudah ada dari komponennya (skor tidak hilang, tapi jadi tidak
// terhubung ke komponen apa pun: tidak tampil di tabel nilai dosen, dan
// tidak ikut terhitung kalau hitungNilaiAkhir dijalankan ulang).
const cekAdaNilaiTerinput = async (rencanaEvaluasiIds, trx) => {
    if (rencanaEvaluasiIds.length === 0) return false;
    const jumlah = await models.NilaiEvaluasiMahasiswa.count({
        where: { siakRencanaEvaluasiId: rencanaEvaluasiIds },
        transaction: trx
    });
    return jumlah > 0;
};

export const salinRencanaEvaluasi = async (mkId, periodeAsalId, periodeTujuanId) => {
    if (periodeAsalId === periodeTujuanId) {
        throw new CustomError.BadRequestError("Periode asal dan tujuan tidak boleh sama");
    }

    const evaluasiAsal = await models.RencanaEvaluasi.findAll({
        where: { siakMataKuliahId: mkId, siakPeriodeAkademikId: periodeAsalId },
        include: [{ model: models.PemetaanEvaluasiCpmk, as: 'pemetaanCpmk', attributes: ['siakCpmkId', 'bobotCpmk'] }],
        order: [['createdAt', 'ASC']]
    });
    if (evaluasiAsal.length === 0) throw new CustomError.NotFoundError("Rencana Evaluasi pada periode asal belum diisi");

    return await sequelize.transaction(async (t) => {
        const existingTujuan = await models.RencanaEvaluasi.findAll({
            where: { siakMataKuliahId: mkId, siakPeriodeAkademikId: periodeTujuanId },
            attributes: ['id'], transaction: t
        });
        const existingIds = existingTujuan.map(e => e.id);

        if (await cekAdaNilaiTerinput(existingIds, t)) {
            throw new CustomError.BadRequestError("Tidak bisa menyalin: sudah ada nilai mahasiswa yang tersimpan untuk Rencana Evaluasi di periode tujuan. Salin Data hanya bisa dilakukan sebelum nilai mulai diisi, agar nilai yang sudah ada tidak terputus dari komponennya.");
        }

        if (existingIds.length > 0) {
            await models.PemetaanEvaluasiCpmk.destroy({ where: { siakRencanaEvaluasiId: existingIds }, force: true, transaction: t });
            await models.RencanaEvaluasi.destroy({ where: { id: existingIds }, force: true, transaction: t });
        }

        for (const evalAsal of evaluasiAsal) {
            const evalBaru = await models.RencanaEvaluasi.create({
                siakMataKuliahId: mkId,
                siakPeriodeAkademikId: periodeTujuanId,
                metodeEvaluasi: evalAsal.metodeEvaluasi,
                jenisEvaluasi: evalAsal.jenisEvaluasi,
                bobot: evalAsal.bobot,
                syaratLulus: evalAsal.syaratLulus,
                deskripsi: evalAsal.deskripsi,
                deskripsiInggris: evalAsal.deskripsiInggris
            }, { transaction: t });

            const pivotData = (evalAsal.pemetaanCpmk || []).map(p => ({
                siakRencanaEvaluasiId: evalBaru.id,
                siakCpmkId: p.siakCpmkId,
                bobotCpmk: p.bobotCpmk
            }));
            if (pivotData.length > 0) {
                await models.PemetaanEvaluasiCpmk.bulkCreate(pivotData, { transaction: t });
            }
        }

        return { jumlahDisalin: evaluasiAsal.length };
    });
};

// =========================================================
// RESET Rencana Evaluasi ke DEFAULT Program Studi
// Ambil dari Template Evaluasi yang cocok (prodi + kurikulum + jenis MK ini),
// wipe & replace Rencana Evaluasi periode ini. Pemetaan CPMK ikut dihapus
// (kosong) karena Template Evaluasi sifatnya prodi-wide, tidak punya info CPMK
// spesifik per MK -- koordinator perlu isi ulang pemetaan CPMK-nya manual.
// =========================================================
export const resetRencanaEvaluasi = async (mkId, periodeId) => {
    const mk = await MataKuliah.findByPk(mkId, {
        attributes: ['id', 'jenis', 'siakProgramStudiId', 'siakTahunKurikulumId']
    });
    if (!mk) throw new CustomError.NotFoundError("Mata Kuliah tidak ditemukan");

    const templateList = await models.TemplateEvaluasi.findAll({
        where: {
            siakProgramStudiId: mk.siakProgramStudiId,
            siakTahunKurikulumId: mk.siakTahunKurikulumId,
            jenisMataKuliah: mk.jenis
        },
        order: [['createdAt', 'ASC']]
    });
    if (templateList.length === 0) {
        throw new CustomError.NotFoundError("Template Evaluasi default untuk Program Studi & Jenis Mata Kuliah ini belum diisi");
    }

    return await sequelize.transaction(async (t) => {
        const existing = await models.RencanaEvaluasi.findAll({
            where: { siakMataKuliahId: mkId, siakPeriodeAkademikId: periodeId },
            attributes: ['id'], transaction: t
        });
        const existingIds = existing.map(e => e.id);

        if (await cekAdaNilaiTerinput(existingIds, t)) {
            throw new CustomError.BadRequestError("Tidak bisa reset: sudah ada nilai mahasiswa yang tersimpan untuk Rencana Evaluasi di periode ini. Reset Data hanya bisa dilakukan sebelum nilai mulai diisi, agar nilai yang sudah ada tidak terputus dari komponennya.");
        }

        if (existingIds.length > 0) {
            await models.PemetaanEvaluasiCpmk.destroy({ where: { siakRencanaEvaluasiId: existingIds }, force: true, transaction: t });
            await models.RencanaEvaluasi.destroy({ where: { id: existingIds }, force: true, transaction: t });
        }

        const dataBaru = templateList.map(tpl => ({
            siakMataKuliahId: mkId,
            siakPeriodeAkademikId: periodeId,
            metodeEvaluasi: tpl.metodeEvaluasi,
            jenisEvaluasi: tpl.jenisEvaluasi,
            bobot: tpl.bobot,
            syaratLulus: tpl.syaratLulus,
            deskripsi: tpl.deskripsi,
            deskripsiInggris: tpl.deskripsiInggris
        }));
        await models.RencanaEvaluasi.bulkCreate(dataBaru, { transaction: t });

        return { jumlahDireset: dataBaru.length };
    });
};

// ============================================================================
// LAPORAN CETAK RPS LENGKAP (Kop + CP + Deskripsi + Rencana Pembelajaran + Rencana Evaluasi)
// Menggabungkan data dari getFormDetailRps, getRencanaPembelajaran, getRencanaEvaluasi,
// dan pemetaan CPL -- supaya FE bisa render 1 halaman cetak utuh seperti Laporan RPS SEVIMA.
// ============================================================================
export const getLaporanRpsCetak = async (mkId, periodeId = null) => {
    const { Dosen, CapaianPembelajaranLulusan, PemetaanCplMk, Fakultas } = models;

    const mk = await MataKuliah.findByPk(mkId, {
        attributes: ['id', 'kode', 'nama', 'totalSks', 'jenis', 'semester'],
        include: [
            {
                model: ProgramStudi, as: 'programStudi', attributes: ['nama', 'siakJenjangId', 'kaprodiId'],
                include: [{ model: Fakultas, as: 'fakultas', attributes: ['nama'] }]
            },
            { model: TahunKurikulum, as: 'tahunKurikulum', attributes: ['tahun'] },
            { model: Dosen, as: 'koordinatorMk', attributes: ['nama', 'nidn'] }
        ]
    });
    if (!mk) throw new CustomError.NotFoundError("Mata Kuliah tidak ditemukan");

    let namaJenjang = 'S1';
    if (mk.programStudi?.siakJenjangId) {
        const j = await Jenjang.findByPk(mk.programStudi.siakJenjangId);
        if (j) namaJenjang = j.jenjang;
    }

    let ketuaProdi = null;
    if (mk.programStudi?.kaprodiId) {
        ketuaProdi = await Dosen.findByPk(mk.programStudi.kaprodiId, { attributes: ['nama', 'nidn'] });
    }

    // 1. Detail RPS (deskripsi, tujuan, bahan kajian, pustaka, media, tgl penyusunan, periode)
    const detail = await getFormDetailRps(mkId, periodeId);
    const periodeTerpilih = detail.daftarPeriode.find(p =>
        periodeId ? p.id === periodeId : (p.adaDataRps && (!detail.daftarPeriode.some(x => x.status === 'Aktif' && x.adaDataRps) || p.status === 'Aktif'))
    ) || detail.daftarPeriode.find(p => p.id === detail.rpsData?.siakPeriodeAkademikId);

    // 2. CPL-Prodi yang dibebankan pada MK ini (via PemetaanCplMk -- pemetaan CPL ke MK langsung)
    let cplList = await CapaianPembelajaranLulusan.findAll({
        include: [{
            model: MataKuliah, as: 'mataKuliahPemeta',
            where: { id: mkId }, attributes: [], through: { attributes: [] }
        }],
        attributes: ['id', 'kode', 'deskripsi'],
        order: [['kode', 'ASC']]
    });

    // Fallback: kalau PemetaanCplMk belum diisi, derive CPL dari pemetaan CPMK->CPL
    // (siak_pemetaan_cpl_cpmk) -- supaya seksi CPL tidak kosong padahal sebenarnya
    // sudah ada hubungan CPL lewat CPMK MK ini.
    if (cplList.length === 0) {
        const rawCplViaCpmk = await CapaianPembelajaranLulusan.findAll({
            include: [{
                model: CapaianMataKuliah, as: 'cpmkPemeta',
                where: { siakMataKuliahId: mkId }, attributes: [], through: { attributes: [] }
            }],
            attributes: ['id', 'kode', 'deskripsi'],
            order: [['kode', 'ASC']]
        });
        const seenId = new Set();
        cplList = rawCplViaCpmk.filter(c => {
            if (seenId.has(c.id)) return false;
            seenId.add(c.id);
            return true;
        });
    }

    // 3. CPMK Induk (untuk seksi "Capaian Pembelajaran Mata Kuliah (CPMK)")
    const cpmkIndukList = await CapaianMataKuliah.findAll({
        where: { siakMataKuliahId: mkId, parentId: null },
        attributes: ['kode', 'deskripsi'],
        order: [['kode', 'ASC']]
    });

    // 4. Rencana Pembelajaran (tabel per sesi/minggu)
    const rencanaPembelajaran = await getRencanaPembelajaran(mkId, periodeId || detail.rpsData?.siakPeriodeAkademikId);
    const sesiList = rencanaPembelajaran.rencanaData.map(r => ({
        sesi: r.sesi,
        cpmkSubCpmk: r.cpmkTerpilih.map(parent => ({
            kode: parent.kode,
            deskripsi: parent.deskripsi,
            subCpmk: (parent.subCpmk || []).map(s => ({ kode: s.kode, deskripsi: s.deskripsi }))
        })),
        indikatorPenilaian: r.indikatorPenilaian,
        kriteriaPenilaian: r.kriteriaPenilaian,
        bentukLuring: r.metodePembelajaranLuring,
        bentukDaring: r.metodePembelajaranDaring,
        materiPembelajaran: r.materiPembelajaran,
        bobotPenilaian: r.bobotPenilaian
    }));

    // 5. Rencana Evaluasi (tabel Unsur Nilai x kolom CPMK/Sub-CPMK leaf)
    const { columns: kolomCpmk } = await getCpmkColumnsForMataKuliah(mkId);
    const rencanaEvaluasi = await getRencanaEvaluasi(mkId, periodeId || detail.rpsData?.siakPeriodeAkademikId);
    const baris = rencanaEvaluasi.rencanaEvaluasi.map(e => ({
        metodeEvaluasi: e.metodeEvaluasi,
        jenisEvaluasi: e.jenisEvaluasi,
        bobotPerKolom: kolomCpmk.map(k => e.mappingBobotCpmk[k.id] ?? 0),
        total: e.bobotEvaluasi
    }));
    const totalPerKolom = kolomCpmk.map((_, idx) => baris.reduce((sum, b) => sum + (b.bobotPerKolom[idx] || 0), 0));
    const totalKeseluruhan = baris.reduce((sum, b) => sum + b.total, 0);

    return {
        kop: {
            programStudi: `${namaJenjang} - ${mk.programStudi?.nama || '-'}`,
            fakultas: mk.programStudi?.fakultas?.nama || '-'
        },
        mataKuliah: {
            kode: mk.kode,
            nama: mk.nama,
            rumpunMk: '-',
            bobotSks: mk.totalSks,
            semester: mk.semester || '-',
            tanggalPenyusunan: detail.rpsData?.tanggalPenyusunan || null
        },
        periodeAkademik: periodeTerpilih?.nama || '-',
        otorisasi: {
            koordinatorRmk: mk.koordinatorMk ? `${mk.koordinatorMk.nidn || ''} - ${mk.koordinatorMk.nama}`.replace(/^- /, '') : '-',
            ketuaProdi: ketuaProdi ? `${ketuaProdi.nidn || ''} - ${ketuaProdi.nama}`.replace(/^- /, '') : '-'
        },
        capaianPembelajaran: {
            cplProdi: cplList.map(c => ({ kode: c.kode, deskripsi: c.deskripsi })),
            cpmk: cpmkIndukList.map(c => ({ kode: c.kode, deskripsi: c.deskripsi }))
        },
        deskripsiSingkat: detail.rpsData?.deskripsiMataKuliah || '-',
        deskripsiSingkatEng: detail.rpsData?.deskripsiMataKuliahEng || '-',
        tujuanMataKuliah: detail.rpsData?.tujuanMataKuliah || '-',
        bahanKajian: detail.rpsData?.materiPembelajaran || '-',
        pustakaUtama: detail.rpsData?.pustakaUtama || '-',
        pustakaPendukung: detail.rpsData?.pustakaPendukung || '-',
        mediaPerangkatLunak: detail.rpsData?.mediaPerangkatLunak || '-',
        mediaPerangkatKeras: detail.rpsData?.mediaPerangkatKeras || '-',
        dosenPengampu: mk.koordinatorMk ? `${mk.koordinatorMk.nidn || ''} - ${mk.koordinatorMk.nama}`.replace(/^- /, '') : '-',
        matakuliahSyarat: '-',
        rencanaPembelajaran: sesiList,
        rencanaEvaluasi: {
            kolomCpmk: kolomCpmk.map(k => ({
                id: k.id, kode: k.kode, parentKode: k.parentKode,
                groupSize: k.groupSize, isGroupFirst: k.isGroupFirst
            })),
            baris,
            totalPerKolom,
            totalKeseluruhan
        }
    };
};

// ============================================================================
// LAPORAN CETAK RPS GABUNGAN -- semua Mata Kuliah dalam 1 Program Studi +
// Tahun Kurikulum, digabung jadi 1 daftar (dasar utk pratinjau JSON & PDF
// gabungan, mirip Laporan Silabus yang menumpuk semua MK dalam 1 file).
// ============================================================================
export const getLaporanRpsGabunganProdi = async (prodiId, tahunKurikulumId, periodeId = null) => {
    const { Fakultas } = models;
    const prodi = await ProgramStudi.findByPk(prodiId, {
        attributes: ['id', 'nama', 'siakJenjangId'],
        include: [{ model: Fakultas, as: 'fakultas', attributes: ['nama'] }]
    });
    if (!prodi) throw new CustomError.NotFoundError("Program Studi tidak ditemukan");

    const tahunKurikulum = await TahunKurikulum.findByPk(tahunKurikulumId, { attributes: ['id', 'tahun'] });
    if (!tahunKurikulum) throw new CustomError.NotFoundError("Tahun Kurikulum tidak ditemukan");

    let namaJenjang = 'S1';
    if (prodi.siakJenjangId) {
        const j = await Jenjang.findByPk(prodi.siakJenjangId);
        if (j) namaJenjang = j.jenjang;
    }

    const daftarMk = await MataKuliah.findAll({
        where: { siakProgramStudiId: prodiId, siakTahunKurikulumId: tahunKurikulumId },
        attributes: ['id', 'kode', 'nama', 'semester'],
        order: [['semester', 'ASC'], ['kode', 'ASC']]
    });

    const daftarRps = [];
    for (const mk of daftarMk) {
        daftarRps.push(await getLaporanRpsCetak(mk.id, periodeId));
    }

    return {
        kop: { programStudi: `${namaJenjang} - ${prodi.nama}`, fakultas: prodi.fakultas?.nama || '-' },
        tahunKurikulum: tahunKurikulum.tahun,
        jumlahMataKuliah: daftarRps.length,
        daftarRps
    };
};