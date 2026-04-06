import models from "../models/index.js";
import { getPagination } from "../utils/pagination.js";

const { 
    sequelize, Rps, MataKuliah, ProgramStudi, TahunKurikulum, 
    Jenjang, PeriodeAkademik, RencanaPembelajaran 
} = models;

const _cekMK = async (mataKuliahId, trx) => {
    const mk = await MataKuliah.findByPk(mataKuliahId, { transaction: trx });
    if (!mk) throw new Error("Mata Kuliah tidak ditemukan");
};

// =========================================================
// GET: Ambil Data untuk Render UI Detail RPS (Halaman 6)
// =========================================================
export const getFormDetailRps = async (mataKuliahId, periodeId = null) => {
    try {
        // 1. Ambil data Mata Kuliah beserta Program Studi (TANPA include Jenjang)
        const mk = await MataKuliah.findByPk(mataKuliahId, {
            attributes: ['id', 'kode', 'nama', 'totalSks', 'jenis'],
            include: [
                { 
                    model: ProgramStudi, 
                    as: 'programStudi', 
                    attributes: ['nama', 'siakJenjangId'] // Ambil ID Jenjang buat bypass
                },
                { model: TahunKurikulum, as: 'tahunKurikulum', attributes: ['tahun'] }
            ]
        });

        if (!mk) throw new Error("Mata Kuliah tidak ditemukan");

        // 2. Format Unit Pengampu dengan JALUR BYPASS (Aman & Super Cepat)
        let teksUnitPengampu = '-';
        if (mk.programStudi) {
            let namaJenjang = 'S1'; // Fallback
            
            // Cari Jenjang manual dari ID
            if (mk.programStudi.siakJenjangId) {
                const jenjang = await Jenjang.findByPk(mk.programStudi.siakJenjangId);
                if (jenjang) {
                    namaJenjang = jenjang.jenjang; // Langsung ambil "S1"
                }
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

        // 4. Ambil Detail RPS
        let whereClause = { siakMataKuliahId: mataKuliahId };
        if (periodeId) {
            whereClause.siakPeriodeAkademikId = periodeId;
        }

        const rpsDetail = await Rps.findOne({
            where: whereClause,
            attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] },
            include: [{ model: PeriodeAkademik, as: 'periode', attributes: ['nama'] }]
        });

        return {
            mataKuliah: formattedMk,
            daftarPeriode: daftarPeriode,
            rpsData: rpsDetail || null
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
export const getRencanaPembelajaran = async (mataKuliahId) => {
    return await RencanaPembelajaran.findAll({
        where: { siakMataKuliahId: mataKuliahId },
        order: [['sesi', 'ASC']],
        // Ambil data dari tabel pivot CPMK juga
        include: [{
            model: models.PemetaanPembelajaranCpmk,
            as: 'pemetaanCpmk',
            attributes: ['siakCpmkId'],
            // Kalau mau narik detail teks CPMK-nya sekalian:
            include: [{
                model: models.CapaianMataKuliah,
                as: 'cpmk',
                attributes: ['kode', 'deskripsi']
            }]
        }]
    });
};

export const createRencanaPembelajaran = async (mataKuliahId, payload) => {
    // Pakai transaction karena kita insert ke 2 tabel (tabel utama & tabel pivot CPMK)
    const trx = await sequelize.transaction();
    try {
        // 1. Simpan data form utama
        const newData = await RencanaPembelajaran.create({
            siakMataKuliahId: mataKuliahId,
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
        }, { transaction: trx });

        // 2. Simpan Mapping CPMK (Checkbox) ke tabel pivot
        if (payload.cpmkIds && Array.isArray(payload.cpmkIds) && payload.cpmkIds.length > 0) {
            const pemetaanData = payload.cpmkIds.map(cpmkId => ({
                siakRencanaPembelajaranId: newData.id,
                siakCpmkId: cpmkId
            }));
            
            // Panggil model pivot yang udah kita buat tadi
            await models.PemetaanPembelajaranCpmk.bulkCreate(pemetaanData, { transaction: trx });
        }

        await trx.commit(); // Eksekusi query!
        
        // Return data yang baru dibuat
        return newData;
    } catch (error) {
        await trx.rollback(); // Batalkan kalau gagal
        throw new Error("Gagal menambah Rencana Pembelajaran: " + error.message);
    }
};

export const updateRencanaPembelajaran = async (id, payload) => {
    try {
        await RencanaPembelajaran.update(payload, { where: { id: id } });
        return await RencanaPembelajaran.findByPk(id, {
            attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] }
        });
    } catch (error) {
        throw new Error("Gagal mengupdate Rencana Pembelajaran: " + error.message);
    }
};

export const deleteRencanaPembelajaran = async (id) => {
    try {
        const deletedRows = await RencanaPembelajaran.destroy({ where: { id: id } });
        return deletedRows > 0;
    } catch (error) {
        throw new Error("Gagal menghapus Rencana Pembelajaran: " + error.message);
    }
};

// ==========================================
// --- BAGIAN RENCANA EVALUASI (HALAMAN 8) ---
// ==========================================
export const getRencanaEvaluasi = async (mataKuliahId) => {
    try {
        return await models.RencanaEvaluasi.findAll({
            where: { siakMataKuliahId: mataKuliahId },
            order: [['createdAt', 'ASC']],
            attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] },
            include: [{
                model: models.PemetaanEvaluasiCpmk,
                as: 'pemetaanCpmk',
                // 👇 JURUS PAKSA: Kasih tau Sequelize nama asli kolomnya di DB
                attributes: ['id', 'siakCpmkId', ['bobot_cpmk', 'bobotCpmk']], 
                include: [{
                    model: models.CapaianMataKuliah,
                    as: 'capaianMataKuliah',
                    attributes: ['kode', 'deskripsi']
                }]
            }]
        });
    } catch (error) {
        throw new Error("Gagal mengambil Rencana Evaluasi: " + error.message);
    }
};

export const createRencanaEvaluasi = async (mataKuliahId, payload) => {
    const trx = await models.sequelize.transaction();
    try {
        const newData = await models.RencanaEvaluasi.create({
            siakMataKuliahId: mataKuliahId,
            siakPeriodeAkademikId: payload.siakPeriodeAkademikId,
            metodeEvaluasi: payload.metodeEvaluasi,
            jenisEvaluasi: payload.jenisEvaluasi,
            bobot: payload.bobot,
            syaratLulus: payload.syaratLulus || false,
            deskripsi: payload.deskripsi,
            deskripsiInggris: payload.deskripsiInggris
        }, { transaction: trx });

        // Simpan Data Bobot per CPMK
        // Format payload.cpmkData: [{ cpmkId: "...", bobotCpmk: 10 }, { cpmkId: "...", bobotCpmk: 20 }]
        if (payload.cpmkData && Array.isArray(payload.cpmkData) && payload.cpmkData.length > 0) {
            const pemetaanData = payload.cpmkData.map(item => ({
                siakRencanaEvaluasiId: newData.id,
                siakCpmkId: item.cpmkId,
                bobotCpmk: item.bobotCpmk || 0
            }));
            await models.PemetaanEvaluasiCpmk.bulkCreate(pemetaanData, { transaction: trx });
        }

        await trx.commit();
        return newData;
    } catch (error) {
        await trx.rollback();
        throw new Error("Gagal menambah Rencana Evaluasi: " + error.message);
    }
};

export const updateRencanaEvaluasi = async (id, payload) => {
    const trx = await models.sequelize.transaction();
    try {
        await models.RencanaEvaluasi.update(payload, { where: { id: id }, transaction: trx });

        if (payload.cpmkData && Array.isArray(payload.cpmkData)) {
            await models.PemetaanEvaluasiCpmk.destroy({ where: { siakRencanaEvaluasiId: id }, transaction: trx });

            if (payload.cpmkData.length > 0) {
                const pemetaanData = payload.cpmkData.map(item => ({
                    siakRencanaEvaluasiId: id,
                    siakCpmkId: item.cpmkId,
                    bobotCpmk: item.bobotCpmk || 0
                }));
                await models.PemetaanEvaluasiCpmk.bulkCreate(pemetaanData, { transaction: trx });
            }
        }

        await trx.commit();
        return await models.RencanaEvaluasi.findByPk(id, { attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] }});
    } catch (error) {
        await trx.rollback();
        throw new Error("Gagal mengupdate Rencana Evaluasi: " + error.message);
    }
};

export const deleteRencanaEvaluasi = async (id) => {
    try {
        const deletedRows = await models.RencanaEvaluasi.destroy({ where: { id: id } });
        return deletedRows > 0;
    } catch (error) {
        throw new Error("Gagal menghapus Rencana Evaluasi: " + error.message);
    }
};