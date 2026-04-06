import models from "../models/index.js";

const { MataKuliah, CapaianMataKuliah, CapaianPembelajaranLulusan, ProgramStudi, TahunKurikulum, Jenjang, PemetaanCplCpmk, sequelize } = models;

// =========================================================
// GET: Ambil Data untuk Render UI Pemetaan CPMK
// =========================================================
export const getFormPemetaanCpmk = async (mataKuliahId) => {
    try {
        // 1. Ambil data Mata Kuliah beserta Header Dinamis
const mk = await MataKuliah.findByPk(mataKuliahId, {
            attributes: ['id', 'kode', 'nama', 'totalSks', 'jenis', 'levelPemetaan', 'metodePembobotan'],
            include: [
                { 
                    model: ProgramStudi, 
                    as: 'programStudi', 
                    attributes: ['nama']
                    // 👇 HAPUS ATAU COMMENT BARIS DI BAWAH INI SEMENTARA 👇
                    // include: [{ model: Jenjang, as: 'jenjang', attributes: ['nama'] }] 
                },
                { model: TahunKurikulum, as: 'tahunKurikulum', attributes: ['tahun'] }
            ]
        });

        if (!mk) throw new Error("Mata Kuliah tidak ditemukan");

        // Format Unit Pengampu (Kita hardcode S1 dulu sementara biar cepat tes POST)
        let teksUnitPengampu = '-';
        if (mk.programStudi) {
            teksUnitPengampu = `S1 - ${mk.programStudi.nama}`; // Fallback cepat
        }
        if (!mk) throw new Error("Mata Kuliah tidak ditemukan");

   

        const formattedMk = {
            id: mk.id,
            kode: mk.kode,
            nama: mk.nama,
            totalSks: mk.totalSks,
            jenis: mk.jenis || '-',
            tahunKurikulum: mk.tahunKurikulum ? mk.tahunKurikulum.tahun : '-',
            unitPengampu: teksUnitPengampu,
            levelPemetaan: mk.levelPemetaan,
            metodePembobotan: mk.metodePembobotan
        };

        // 2. Ambil CPL Headers
        const cplTerpilih = await CapaianPembelajaranLulusan.findAll({
            include: [{
                model: MataKuliah, as: 'mataKuliahPemeta',
                where: { id: mataKuliahId }, attributes: [], through: { attributes: [] }
            }],
            attributes: ['id', 'kode', 'deskripsi'],
            order: [['kode', 'ASC']]
        });

        // 3. Ambil daftar CPMK yang sudah ada berserta nilai bobot CPL-nya
        const cpmkList = await CapaianMataKuliah.findAll({
            where: { siakMataKuliahId: mataKuliahId },
            include: [{
                model: CapaianPembelajaranLulusan, as: 'cplDiCPMK',
                attributes: ['id'], 
                through: { attributes: ['bobotCpl'] } // <-- Ambil nilai 90, 10 dari pivot
            }],
            order: [['createdAt', 'ASC']]
        });

        // Format data untuk memanjakan Frontend
        const formattedCpmk = cpmkList.map(cpmk => ({
            id: cpmk.id,
            kode: cpmk.kode,
            deskripsi: cpmk.deskripsi,
            target: cpmk.target,
            bobot: cpmk.bobot,
            // Array berisi Objek ID CPL dan Nilainya
            cplPemetaan: cpmk.cplDiCPMK.map(c => ({
                idCpl: c.id,
                bobotCpl: c.PemetaanCplCpmk ? c.PemetaanCplCpmk.bobotCpl : 0
            }))
        }));

        return {
            mataKuliah: formattedMk,
            cplHeaders: cplTerpilih, 
            cpmkData: formattedCpmk  
        };
    } catch (error) {
        throw new Error(`Gagal memuat form CPMK: ${error.message}`);
    }
}

// =========================================================
// POST: Simpan Semua Data (Pengaturan & Row CPMK beserta Nilai Bobotnya)
// =========================================================
export const savePemetaanCpmk = async (mataKuliahId, payload) => {
    try {
        await sequelize.transaction(async (t) => {
            // 1. Update pengaturan Mata Kuliah
            await MataKuliah.update({
                levelPemetaan: payload.levelPemetaan,
                metodePembobotan: payload.metodePembobotan
            }, { where: { id: mataKuliahId }, transaction: t });

            // 2. Bersihkan CPMK lama
            await CapaianMataKuliah.destroy({
                where: { siakMataKuliahId: mataKuliahId },
                force: true, 
                transaction: t
            });

            // 3. Insert ulang CPMK Baru
            if (payload.cpmkList && payload.cpmkList.length > 0) {
                for (const item of payload.cpmkList) {
                    const newCpmk = await CapaianMataKuliah.create({
                        siakMataKuliahId: mataKuliahId,
                        kode: item.kode,
                        deskripsi: item.deskripsi,
                        target: item.target || 0,
                        bobot: item.bobot || 0
                    }, { transaction: t });

                    // 4. Insert nilai Bobot (90, 10, dll) secara manual ke tabel pivot
                    if (item.cplPemetaan && item.cplPemetaan.length > 0) {
                        const pivotData = item.cplPemetaan.map(p => ({
                            siakCapaianMataKuliahId: newCpmk.id,
                            siakCapaianPembelajaranLulusanId: p.idCpl,
                            bobotCpl: p.bobotCpl || 0
                        }));
                        
                        await PemetaanCplCpmk.bulkCreate(pivotData, { transaction: t });
                    }
                }
            }
        });

        return await getFormPemetaanCpmk(mataKuliahId);
    } catch (error) {
        throw new Error(`Gagal menyimpan CPMK: ${error.message}`);
    }
}