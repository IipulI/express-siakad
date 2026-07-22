import db from "../models/index.js";
import { Op } from "sequelize";

const {
    HasilStudi,
    KelasKuliah,
    KrsMahasiswa,
    Mahasiswa,
    MataKuliah,
    PeriodeAkademik,
    RincianKrsMahasiswa,
    NilaiCpmkMahasiswa,
    CapaianMataKuliah,
} = db;

// Susun daftar CPMK datar jadi hierarki CPMK induk -> Sub-CPMK anak, plus status
// "Memenuhi"/"Belum Memenuhi" vs target. Field BARU (capaianCpmk), tidak mengubah
// field yang sudah ada -- supaya FE yang sudah konsumsi struktur lama tetap jalan.
const susunHirarkiCpmk = (nilaiCpmkRows) => {
    const byId = new Map();
    nilaiCpmkRows.forEach(n => {
        const cpmk = n.capaianMataKuliah;
        if (!cpmk) return;
        byId.set(cpmk.id, {
            kode: cpmk.kode,
            deskripsi: cpmk.deskripsi,
            nilai: n.nilai != null ? parseFloat(n.nilai) : null,
            target: cpmk.target != null ? parseFloat(cpmk.target) : null,
            parentId: cpmk.parentId,
            // Target cuma beneran diisi di level CPMK induk -- Sub-CPMK targetnya 0/kosong
            // di RPS, jadi "Memenuhi/Belum Memenuhi" cuma masuk akal kalau target > 0.
            // Kalau target 0 (kebanyakan Sub-CPMK anak), tampilin "Tanpa Target" -- jangan
            // ikut dibilang "Memenuhi" cuma karena nilai >= 0 (menyesatkan).
            status: n.nilai == null
                ? 'Belum Dinilai'
                : (cpmk.target != null && parseFloat(cpmk.target) > 0)
                    ? (parseFloat(n.nilai) >= parseFloat(cpmk.target) ? 'Memenuhi' : 'Belum Memenuhi')
                    : 'Tanpa Target',
            subCpmk: [],
        });
    });
    const roots = [];
    byId.forEach(item => {
        if (item.parentId && byId.has(item.parentId)) {
            byId.get(item.parentId).subCpmk.push(item);
        } else {
            roots.push(item);
        }
    });
    roots.forEach(r => { delete r.parentId; r.subCpmk.forEach(s => delete s.parentId); });
    return roots;
};

export const getTranskrip = async (mahasiswaId) => {
    try {
        const mahasiswa = await Mahasiswa.findByPk(mahasiswaId, {
            attributes: ["id", "nama", "periodeMasuk"],
        });
        if (!mahasiswa) {
            throw new Error(`Mahasiswa dengan Id ${mahasiswaId} tidak ditemukan`);
        }

        const rincianKrsMahasiswa = await RincianKrsMahasiswa.findAll({
            attributes: [
                "id",
                "kehadiran",
                "tugas",
                "uts",
                "uas",
                "nilai",
                "hurufMutu",
                "angkaMutu",
                "nilaiAkhir",
                "siakKelasKuliahId",
            ],
            where: {
                status: { [Op.in]: ['Dikunci', 'Lulus', 'Tidak Lulus'] }
            },
            include: [
                {
                    attributes: ["semester"],
                    where: {
                        siakMahasiswaId: mahasiswaId,
                    },
                    model: KrsMahasiswa,
                    as: "krsMahasiswa",
                    required: true,
                },
                {
                    attributes: ['id', 'siakMataKuliahId', 'nama'],
                    model: KelasKuliah,
                    as: "kelasKuliah",
                    include: {
                        attributes: ['id', "nama", "kode", "totalSks", "nilaiMin"],
                        model: MataKuliah,
                        as: "mataKuliah",
                        where: {
                            // nilaiMin: { [Op.ne]: "D" },
                        },
                    },
                },
            ],
            order: [
                [{ model: KrsMahasiswa, as: "krsMahasiswa" }, "semester", "ASC"],
            ],
        });

        // Dedup per kelas: kalau mahasiswa kebetulan punya >1 baris RincianKrsMahasiswa
        // untuk kelas yang sama (data KRS duplikat), jangan tampil 2x di transkrip --
        // prioritaskan baris yang ada nilainya (pola sama dgn getPesertaKelasList).
        const rincianPerKelas = new Map();
        rincianKrsMahasiswa.forEach((item) => {
            const kelasId = item.siakKelasKuliahId;
            if (!kelasId) return;
            const existing = rincianPerKelas.get(kelasId);
            if (!existing || (item.nilaiAkhir != null && existing.nilaiAkhir == null)) {
                rincianPerKelas.set(kelasId, item);
            }
        });

        // Tambahan: detail capaian CPMK/Sub-CPMK per mata kuliah (field baru, additive).
        const rincianArray = Array.from(rincianPerKelas.values()).map((item) => item.get({ plain: true }));
        const kelasIds = rincianArray.map((item) => item.siakKelasKuliahId).filter(Boolean);
        if (kelasIds.length > 0) {
            const semuaNilaiCpmk = await NilaiCpmkMahasiswa.findAll({
                where: { siakKelasKuliahId: { [Op.in]: kelasIds }, siakMahasiswaId: mahasiswaId },
                include: [{ model: CapaianMataKuliah, as: 'capaianMataKuliah', attributes: ['id', 'kode', 'deskripsi', 'target', 'parentId'] }],
            });
            const nilaiCpmkPerKelas = new Map();
            semuaNilaiCpmk.forEach((n) => {
                const list = nilaiCpmkPerKelas.get(n.siakKelasKuliahId) || [];
                list.push(n);
                nilaiCpmkPerKelas.set(n.siakKelasKuliahId, list);
            });
            rincianArray.forEach((item) => {
                const rows = nilaiCpmkPerKelas.get(item.siakKelasKuliahId) || [];
                item.capaianCpmk = susunHirarkiCpmk(rows);
            });
        } else {
            rincianArray.forEach((item) => { item.capaianCpmk = []; });
        }

        return {
            rincianKrs: rincianArray,
        };
    } catch (error) {
        console.log(error);
        throw new Error(error.message);
    }
};
