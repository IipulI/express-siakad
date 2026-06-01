import models from "../models/index.js";
import { getPagination } from "../utils/pagination.js";
import * as CustomError from "../utils/custom-error.js";

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

export const updateRencanaPembelajaran = async (id, payload, mkId) => {
    return await sequelize.transaction(async (t) => {
        const sesi = await RencanaPembelajaran.findByPk(id, { transaction: t });
        if (!sesi) throw new CustomError.NotFoundError("Data sesi tidak ditemukan");

        // Validasi 100% Bobot (Kecualikan ID yang sedang diupdate)
        const existingSesi = await RencanaPembelajaran.findAll({
            where: { 
                siakMataKuliahId: mkId, 
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
                as: 'pemetaanCpmk',
                include: [{ model: models.CapaianMataKuliah, as: 'capaianMataKuliah', attributes: ['id', 'kode'] }]
            }]
        });

        // E. Mapping untuk Frontend
        const formattedEvaluasi = evaluasiData.map(ev => {
            const e = ev.toJSON();
            const mappingBobot = {};
            
            (e.pemetaanCpmk || []).forEach(p => {
                if (p.capaianMataKuliah) {
                    mappingBobot[p.capaianMataKuliah.id] = parseFloat(p.bobotCpmk || 0);
                }
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
    // 💾 BLOK DATABASE: WIPE & REPLACE
    // ----------------------------------------------------------------
    return await sequelize.transaction(async (trx) => {
        
        // A. Bersihkan data evaluasi lama di periode ini (Pivot otomatis ikut kehapus)
        await models.RencanaEvaluasi.destroy({ 
            where: { siakMataKuliahId: mkId, siakPeriodeAkademikId }, 
            transaction: trx 
        });

        // B. Masukkan data evaluasi yang baru
        for (const row of evaluasiList) {
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

            // C. Masukkan Mapping ke CPMK-nya
            if (row.cpmkData && row.cpmkData.length > 0) {
                const pivotData = row.cpmkData.map(c => ({
                    siakRencanaEvaluasiId: newEvaluasi.id,
                    siakCpmkId: c.cpmkId,
                    bobotCpmk: c.bobotCpmk
                }));
                await models.PemetaanEvaluasiCpmk.bulkCreate(pivotData, { transaction: trx });
            }
        }

        return true;
    });
};
export const deleteRencanaEvaluasi = async (id) => {
    try {
        const deleted = await models.RencanaEvaluasi.destroy({ where: { id } });
        return deleted > 0;
    } catch (error) { throw new Error(error.message); }
};