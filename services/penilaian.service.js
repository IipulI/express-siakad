import models from "../models/index.js";
import { Op } from 'sequelize';

const { 
    sequelize, KomposisiNilaiMataKuliah, PemetaanEvaluasiCpmk, 
    NilaiEvaluasiMahasiswa, RincianKrsMahasiswa, KrsMahasiswa, Mahasiswa,
} = models;

// 1. SETUP RPS: Dosen mensetup komponen evaluasi (Teori/Praktikum/Proyek) beserta relasi CPMK
export const createKomposisiEvaluasi = async (mataKuliahId, komposisiData) => {
    /* Format payload:
       [
         { namaKomponen: "Proyek Akhir", persentase: 50, key: "proyek_1", cpmkIds: ["uuid-cpmk1", "uuid-cpmk2"] },
         { namaKomponen: "Laporan Praktikum", persentase: 50, key: "prak_1", cpmkIds: ["uuid-cpmk3"] }
       ]
    */
    try {
        await sequelize.transaction(async (trx) => {
            // Bersihkan data lama jika dosen melakukan update skema
            await KomposisiNilaiMataKuliah.destroy({ where: { siakMataKuliahId: mataKuliahId }, transaction: trx });

            for (const item of komposisiData) {
                const komposisi = await KomposisiNilaiMataKuliah.create({
                    siakMataKuliahId: mataKuliahId,
                    namaKomponen: item.namaKomponen,
                    persentase: item.persentase,
                    key: item.key // <--- INI TAMBAHANNYA AGAR TIDAK NULL
                }, { transaction: trx });

                // Mapping ke CPMK
                if (item.cpmkIds && item.cpmkIds.length > 0) {
                    const pemetaan = item.cpmkIds.map(cpmkId => ({
                        siakKomposisiNilaiId: komposisi.id,
                        siakCapaianMataKuliahId: cpmkId
                    }));
                    await PemetaanEvaluasiCpmk.bulkCreate(pemetaan, { transaction: trx });
                }
            }
        });
        return true;
    } catch (error) {
        throw new Error("Gagal menyimpan struktur evaluasi RPS: " + error.message);
    }
}

// GET SETUP EVALUASI (Untuk menampilkan data di Halaman 8 PDF)
export const getKomposisiEvaluasi = async (mataKuliahId) => {
    try {
        const { KomposisiNilaiMataKuliah, PemetaanEvaluasiCpmk, CapaianMataKuliah } = models;
        
        const data = await KomposisiNilaiMataKuliah.findAll({
            where: { siakMataKuliahId: mataKuliahId },
            // PERBAIKAN: Hapus 'namaKomponen' karena di database menggunakan 'key'
            attributes: ['id', 'persentase', 'key'],
            include: [{
                model: CapaianMataKuliah,
                as: 'cpmkList', 
                attributes: ['id', 'kode', 'deskripsi'],
                through: { attributes: [] } 
            }],
            // PERBAIKAN: Gunakan format standar Sequelize untuk urutan waktu
            order: [['createdAt', 'ASC']] 
        });

        return data;
    } catch (error) {
        throw new Error("Gagal mengambil struktur evaluasi RPS: " + error.message);
    }
}

// 2. INPUT NILAI DINAMIS: Menyimpan skor mahasiswa dalam bentuk Array
export const inputNilaiMahasiswa = async (krsId, arrNilai) => {
    try {
        await sequelize.transaction(async (trx) => {
            // Hapus nilai lama agar bersih saat update
            await NilaiEvaluasiMahasiswa.destroy({ where: { siakRincianKrsMahasiswaId: krsId }, transaction: trx });

            const payload = arrNilai.map(item => ({
                siakRincianKrsMahasiswaId: krsId,
                siakKomposisiNilaiId: item.komposisiId,
                skor: item.skor
            }));

            await NilaiEvaluasiMahasiswa.bulkCreate(payload, { transaction: trx });
        });
        return true;
    } catch (error) {
        throw new Error("Gagal menyimpan nilai evaluasi: " + error.message);
    }
}

// 3. KALKULATOR HASIL AKHIR OBE
export const hitungNilaiAkhir = async (krsId) => {
    try {
        return await sequelize.transaction(async (trx) => {
            const listNilai = await NilaiEvaluasiMahasiswa.findAll({
                where: { siakRincianKrsMahasiswaId: krsId },
                include: [{ model: KomposisiNilaiMataKuliah, as: 'komposisiNilai' }],
                transaction: trx
            });

            let totalSkor = 0;
            listNilai.forEach(item => {
                const skor = parseFloat(item.skor);
                const bobot = parseFloat(item.komposisiNilai.persentase) / 100;
                totalSkor += (skor * bobot);
            });

       // Konversi rentang Huruf Mutu (Sesuai dengan tabel siak_skala_penilaian)
            let hurufMutu = 'E'; 
            let angkaMutu = 0.0;

            if (totalSkor >= 81.00) { 
                hurufMutu = 'A'; angkaMutu = 4.0; 
            } else if (totalSkor >= 76.00) { 
                hurufMutu = 'AB'; angkaMutu = 3.5; 
            } else if (totalSkor >= 71.00) { 
                hurufMutu = 'B'; angkaMutu = 3.0; 
            } else if (totalSkor >= 66.00) { 
                hurufMutu = 'BC'; angkaMutu = 2.5; 
            } else if (totalSkor >= 61.00) { 
                hurufMutu = 'C'; angkaMutu = 2.0; 
            } else if (totalSkor >= 41.00) { 
                hurufMutu = 'CD'; angkaMutu = 1.5; 
            } else if (totalSkor >= 1.00) { 
                hurufMutu = 'D'; angkaMutu = 1.0; 
            } else {
                hurufMutu = 'E'; angkaMutu = 0.0;
            }
            await RincianKrsMahasiswa.update(
                { nilai_akhir: totalSkor, huruf_mutu: hurufMutu, angka_mutu: angkaMutu },
                { where: { id: krsId }, transaction: trx }
            );

            return { krsId, totalSkor, hurufMutu, angkaMutu };
        });
    } catch (error) {
        throw new Error("Gagal kalkulasi nilai: " + error.message);
    }
}
// 4. GENERATOR RAPOR OBE MAHASISWA
// Di dalam file services/penilaian.service.js

// =====================================================================
// GENERATOR RAPOR OBE MAHASISWA
// =====================================================================
export const getRaporOBEMahasiswa = async (rincianKrsId) => {
    try {
        const ModelNilai = models.NilaiEvaluasiMahasiswa || models.siak_nilai_evaluasi_mahasiswa;
        const ModelKomposisi = models.KomposisiNilaiMataKuliah || models.siak_komposisi_nilai_mata_kuliah;
        const ModelCPMK = models.CapaianMataKuliah || models.siak_capaian_mata_kuliah;

        const listNilai = await ModelNilai.findAll({
            where: { siakRincianKrsMahasiswaId: rincianKrsId }, 
            include: [{
                model: ModelKomposisi,
                as: 'komposisiNilai',
                include: [{
                    model: ModelCPMK,
                    as: 'cpmkList', // Pastikan alias ini masih sama
                    attributes: ['id', 'kode', 'deskripsi'] // Ambil kode dan deskripsi CPMK
                }]
            }]
        });

        let raporCPMK = {};

        listNilai.forEach(nilai => {
            const skorAsli = parseFloat(nilai.skor);
            const bobotPersentase = parseFloat(nilai.komposisiNilai.persentase) / 100;
            const skorTerbobot = skorAsli * bobotPersentase;

            if (nilai.komposisiNilai && nilai.komposisiNilai.cpmkList) {
                nilai.komposisiNilai.cpmkList.forEach(cpmk => {
                    // Gunakan KODE CPMK agar jelas dibaca oleh Frontend
                    const kodeCpmk = cpmk.kode || cpmk.id; 
                    
                    if (kodeCpmk) {
                        if (!raporCPMK[kodeCpmk]) {
                            raporCPMK[kodeCpmk] = { 
                                kode: kodeCpmk, 
                                deskripsi: cpmk.deskripsi || '-', 
                                totalSkorTerbobot: 0, 
                                totalBobotMaksimal: 0 
                            };
                        }
                        raporCPMK[kodeCpmk].totalSkorTerbobot += skorTerbobot;
                        raporCPMK[kodeCpmk].totalBobotMaksimal += (100 * bobotPersentase);
                    }
                });
            }
        });

        // Format hasil akhir menjadi array dengan persentase 0-100%
        return Object.keys(raporCPMK).map(kode => {
            const item = raporCPMK[kode];
            // Hitung persentase akhir capaian kompetensi
            const persentase = item.totalBobotMaksimal > 0 
                ? (item.totalSkorTerbobot / item.totalBobotMaksimal) * 100 
                : 0;

            return {
                kodeCpmk: item.kode,
                deskripsi: item.deskripsi,
                nilaiCapaian: parseFloat(persentase.toFixed(2)) // Dibulatkan 2 angka desimal
            };
        });

    } catch (error) {
        throw new Error("Gagal menggenerate rapor OBE: " + error.message);
    }
}
// Pastikan model master sudah di-import di bagian atas file
const { 
    MasterMetodeEvaluasi, 
    MasterKomponenEvaluasi 
} = models;

// ... (kode service yang lain)

export const getDropdownMasterEvaluasi = async () => {
    try {
        // Ambil data secara paralel
        const [metodeList, komponenList] = await Promise.all([
            MasterMetodeEvaluasi.findAll({
                attributes: ['id', 'namaMetode'],
                order: [['nama_metode', 'ASC']]
            }),
            MasterKomponenEvaluasi.findAll({
                attributes: ['id', 'namaKomponen'],
                order: [['nama_komponen', 'ASC']]
            })
        ]);

        // Kembalikan dalam format object yang mudah dikonsumsi frontend
        return {
            metodeEvaluasi: metodeList,
            komponenEvaluasi: komponenList
        };
    } catch (error) {
        throw new Error("Gagal mengambil data master evaluasi: " + error.message);
    }
}
export const getTemplateEvaluasiList = async (page = 1, limit = 10, search = '') => {
    // 1. Ambil model secara dinamis dari objek models
    // Jika di console.log tadi namanya 'siak_mata_kuliah', ganti baris ini
    const MKModel = models.MataKuliah || models.siak_mata_kuliah;
    const KomposisiModel = models.KomposisiNilaiMataKuliah || models.siak_komposisi_nilai_mata_kuliah;

    if (!MKModel) {
        throw new Error("Model Mata Kuliah tidak ditemukan di Sequelize!");
    }

    try {
        const offset = (page - 1) * limit;
        const whereCondition = search ? {
            nama: { [Op.iLike]: `%${search}%` }
        } : {};

        const { count, rows } = await MKModel.findAndCountAll({
            where: whereCondition,
            include: [{
                model: KomposisiModel,
                as: 'komposisiNilai', 
                attributes: ['id', 'persentase', 'key'], 
                required: false
            }],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['nama', 'ASC']]
        });

        return {
            totalData: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            data: rows
        };
    } catch (error) {
        console.error("DEBUG ERROR:", error);
        throw new Error("Gagal mengambil daftar template evaluasi: " + error.message);
    }

    
}
// =====================================================================
// GET PESERTA KELAS (Untuk Dosen Input Nilai)
// =====================================================================
// =====================================================================
// GET PESERTA KELAS (Untuk Dosen Input Nilai)
// =====================================================================
export const getPesertaKelasList = async (kelasId) => {
    try {
        const peserta = await RincianKrsMahasiswa.findAll({
            where: { siak_kelas_kuliah_id: kelasId }, 
            attributes: ['id', 'nilai_akhir', 'huruf_mutu', 'angka_mutu'], 
            include: [
                {
                    model: KrsMahasiswa,
                    as: 'krsMahasiswa', // Sudah benar dari langkah sebelumnya
                    attributes: ['id', 'semester'],
                    include: [
                        {
                            model: Mahasiswa,
                            as: 'mahasiswa', 
                            attributes: ['id', 'nama', 'npm', 'angkatan']
                        }
                    ]
                },
                {
                    model: NilaiEvaluasiMahasiswa,
                    as: 'daftarNilaiEvaluasi', // <--- UBAH ALIAS KEDUA DI SINI
                    attributes: ['id', 'siak_komposisi_nilai_id', 'skor'],
                    required: false 
                }
            ]
        });

        const formattedData = peserta.map(item => ({
            rincianKrsId: item.id, 
            mahasiswaId: item.krsMahasiswa?.mahasiswa?.id,
            npm: item.krsMahasiswa?.mahasiswa?.npm,
            nama: item.krsMahasiswa?.mahasiswa?.nama,
            angkatan: item.krsMahasiswa?.mahasiswa?.angkatan,
            nilaiAkhir: item.nilai_akhir || 0,
            hurufMutu: item.huruf_mutu || '-',
            angkaMutu: item.angka_mutu || 0,
            detailNilai: item.daftarNilaiEvaluasi || [] // <--- UBAH JUGA DI SINI
        }));

        formattedData.sort((a, b) => (a.npm || '').localeCompare(b.npm || ''));

        return formattedData;
    } catch (error) {
        throw new Error("Gagal mengambil daftar peserta kelas: " + error.message);
    }
}