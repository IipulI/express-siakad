import models from '../models/index.js';
import * as CustomError from '../utils/custom-error.js';
import { getCpmkColumnsForMataKuliah } from './cpmk.service.js';

const {
    KelasKuliah, MataKuliah, ProgramStudi, TahunKurikulum, PeriodeAkademik, Jenjang,
    CapaianMataKuliah, CapaianPembelajaranLulusan,
    RincianKrsMahasiswa, KrsMahasiswa, Mahasiswa,
    PemetaanCplCpmk, sequelize
} = models;

// ============================================================
// HELPER: Ambil info header kelas
// ============================================================
const getKelasHeader = async (kelasId) => {
    const kelas = await KelasKuliah.findByPk(kelasId, {
        include: [
            {
                model: MataKuliah, as: 'mataKuliah',
                include: [
                    { model: ProgramStudi, as: 'programStudi',
                      include: [{ model: Jenjang, as: 'jenjang', attributes: ['jenjang'] }] },
                    { model: TahunKurikulum, as: 'tahunKurikulum' }
                ]
            },
            { model: PeriodeAkademik, as: 'periodeAkademik', attributes: ['nama'] }
        ]
    });
    if (!kelas) throw new CustomError.NotFoundError('Kelas tidak ditemukan');
    return kelas;
};

// ============================================================
// SERVICE A: CAPAIAN PEMBELAJARAN — TAB CPMK
// ============================================================
export const getCapaianCpmkKelas = async (kelasId) => {
    const kelas = await getKelasHeader(kelasId);
    const mkId = kelas.siakMataKuliahId || kelas.siak_mata_kuliah_id;

    // Kolom CPMK (leaf-level: Sub-CPMK jika ada, atau CPMK itu sendiri jika tidak)
    const { columns: cpmkColumns, hasSubCpmk } = await getCpmkColumnsForMataKuliah(mkId);

    if (cpmkColumns.length === 0) {
        return {
            header: buildHeader(kelas),
            cpmkInfo: [],
            hasSubCpmk: false,
            targetCpmk: {},
            tabel: [],
            rerataPerolehan: {},
            pesan: 'CPMK belum disetup oleh Koordinator MK'
        };
    }

    // Ambil peserta aktif di kelas ini
    const pesertaRaw = await sequelize.query(`
        SELECT * FROM (
            SELECT DISTINCT ON (m.id)
                m.id AS mahasiswa_id,
                m.npm,
                m.nama,
                m.angkatan
            FROM siak_rincian_krs_mahasiswa rkm
            LEFT JOIN siak_krs_mahasiswa krs ON rkm.siak_krs_mahasiswa_id = krs.id
            LEFT JOIN siak_mahasiswa m ON krs.siak_mahasiswa_id = m.id
            WHERE rkm.siak_kelas_kuliah_id = :kelasId
              AND rkm.deleted_at IS NULL
              AND krs.deleted_at IS NULL
            ORDER BY m.id
        ) peserta
        ORDER BY peserta.npm ASC
    `, {
        replacements: { kelasId },
        type: sequelize.QueryTypes.SELECT
    });

    if (pesertaRaw.length === 0) {
        return {
            header: buildHeader(kelas),
            cpmkInfo: cpmkColumns.map(c => ({
                id: c.id, kode: c.kode, deskripsi: c.deskripsi,
                parentKode: c.parentKode, parentDeskripsi: c.parentDeskripsi,
                groupSize: c.groupSize, isGroupFirst: c.isGroupFirst
            })),
            hasSubCpmk,
            targetCpmk: Object.fromEntries(cpmkColumns.map(c => [c.kode, c.target])),
            tabel: [],
            rerataPerolehan: {},
            pesan: 'Tidak ada peserta di kelas ini'
        };
    }

    // Ambil nilai CPMK per leaf (Sub-CPMK / CPMK) — tanpa rollup, karena
    // siak_nilai_cpmk_mahasiswa.siak_capaian_mata_kuliah_id sudah mengarah
    // ke leaf yang dipetakan di Rencana Evaluasi.
    const nilaiCpmkRaw = await sequelize.query(`
        SELECT
            n.siak_mahasiswa_id,
            c.id AS cpmk_id,
            AVG(n.nilai)::FLOAT AS avg_nilai
        FROM siak_nilai_cpmk_mahasiswa n
        JOIN siak_capaian_mata_kuliah c
            ON c.id = n.siak_capaian_mata_kuliah_id
           AND c.deleted_at IS NULL
        WHERE n.siak_kelas_kuliah_id = :kelasId
          AND n.deleted_at IS NULL
        GROUP BY n.siak_mahasiswa_id, c.id
    `, {
        replacements: { kelasId },
        type: sequelize.QueryTypes.SELECT
    });

    // Bangun map: { mhsId: { cpmkId: avg_nilai } }
    const nilaiMap = {};
    nilaiCpmkRaw.forEach(row => {
        const mId = String(row.siak_mahasiswa_id);
        const cId = String(row.cpmk_id);
        if (!nilaiMap[mId]) nilaiMap[mId] = {};
        nilaiMap[mId][cId] = parseFloat(row.avg_nilai || 0);
    });

    // Deteksi pemetaan berbeda: ada nilai tersimpan dengan CPMK ID
    // yang tidak cocok dengan kolom CPMK saat ini
    const currentCpmkIds = new Set(cpmkColumns.map(c => String(c.id)));
    const storedCpmkIds = new Set(nilaiCpmkRaw.map(r => String(r.cpmk_id)));
    const pemetaanBerbeda = storedCpmkIds.size > 0 &&
        [...storedCpmkIds].some(id => !currentCpmkIds.has(id));

    // Inisialisasi target & rerata
    const targetCpmk = {};
    const rerataSum = {};
    const rerataCount = {};
    cpmkColumns.forEach(c => {
        targetCpmk[c.kode] = c.target;
        rerataSum[c.kode] = 0;
        rerataCount[c.kode] = 0;
    });

    let no = 1;
    const tabel = pesertaRaw.map(p => {
        const safeMhsId = String(p.mahasiswa_id);
        const nilaiPerCpmk = {};
        let sudahDinilai = false;

        cpmkColumns.forEach(c => {
            const safeCId = String(c.id);
            const nilai = nilaiMap[safeMhsId]?.[safeCId];

            if (nilai !== undefined && !isNaN(nilai)) {
                nilaiPerCpmk[c.kode] = parseFloat(nilai.toFixed(2));
                rerataSum[c.kode] += nilai;
                rerataCount[c.kode]++;
                sudahDinilai = true;
            } else {
                nilaiPerCpmk[c.kode] = null;
            }
        });

        let statusCapaian = 'Belum Dinilai';
        if (sudahDinilai) {
            const semuaMencapai = cpmkColumns.every(c => {
                const n = nilaiPerCpmk[c.kode];
                return n !== null && n >= targetCpmk[c.kode];
            });
            statusCapaian = semuaMencapai ? 'Sudah Memenuhi' : 'Belum Memenuhi';
        }

        return {
            no: no++,
            nim: p.npm || '-',
            nama: p.nama || '-',
            angkatan: p.angkatan || '-',
            ...nilaiPerCpmk,
            nilaiCpmk: nilaiPerCpmk,
            statusCapaian
        };
    });

    const rerataPerolehan = {};
    cpmkColumns.forEach(c => {
        rerataPerolehan[c.kode] = rerataCount[c.kode] > 0
            ? parseFloat((rerataSum[c.kode] / rerataCount[c.kode]).toFixed(2))
            : null;
    });

    const header = buildHeader(kelas);
    return {
        header: { ...header, peserta: tabel.length },
        cpmkInfo: cpmkColumns.map(c => ({
            id: c.id, kode: c.kode, deskripsi: c.deskripsi,
            parentKode: c.parentKode, parentDeskripsi: c.parentDeskripsi,
            groupSize: c.groupSize, isGroupFirst: c.isGroupFirst
        })),
        hasSubCpmk,
        targetCpmk,
        tabel,
        ...rerataPerolehan,
        rerataPerolehan,
        pemetaanBerbeda
    };
};
// ============================================================
// SERVICE B: CAPAIAN PEMBELAJARAN — TAB CPL
// ============================================================
export const getCapaianCplKelas = async (kelasId) => {
    const kelas = await getKelasHeader(kelasId);
    const mkId = kelas.siakMataKuliahId || kelas.siak_mata_kuliah_id;

    const pesertaCountRaw = await sequelize.query(`
            SELECT COUNT(DISTINCT krs.siak_mahasiswa_id) AS count
            FROM siak_rincian_krs_mahasiswa rkm
            JOIN siak_krs_mahasiswa krs ON rkm.siak_krs_mahasiswa_id = krs.id
            WHERE rkm.siak_kelas_kuliah_id = :kelasId
              AND rkm.deleted_at IS NULL
              AND krs.deleted_at IS NULL
        `, { replacements: { kelasId }, type: sequelize.QueryTypes.SELECT });
    const pesertaCount = parseInt(pesertaCountRaw[0]?.count || 0, 10);

    const baseHeader = { ...buildHeader(kelas), peserta: pesertaCount };

    const cplList = await CapaianPembelajaranLulusan.findAll({
        include: [{
            model: MataKuliah, as: 'mataKuliahPemeta',
            where: { id: mkId }, attributes: [], through: { attributes: [] }
        }],
        order: [['kode', 'ASC']]
    });

    if (cplList.length === 0) {
        return {
            header: baseHeader,
            pesan: 'CPL belum dipetakan ke Mata Kuliah ini',
            cplInfo: [], targetCpl: {}, tabel: [], rerataPerolehan: {}
        };
    }

    const pesertaRaw = await RincianKrsMahasiswa.findAll({
        where: { siak_kelas_kuliah_id: kelasId },
        include: [{
            model: KrsMahasiswa, as: 'krsMahasiswa',
            include: [{ model: Mahasiswa, as: 'mahasiswa',
                        attributes: ['id', 'nama', 'npm', 'angkatan'] }]
        }],
        order: [[{ model: KrsMahasiswa, as: 'krsMahasiswa' },
                 { model: Mahasiswa, as: 'mahasiswa' }, 'npm', 'ASC']]
    });

    const pesertaMap = {};
    pesertaRaw.forEach(item => {
        const mhs = item.krsMahasiswa?.mahasiswa;
        const mhsId = mhs?.id || mhs?.getDataValue?.('id') || item.krsMahasiswa?.siakMahasiswaId;
        if (mhsId) {
            pesertaMap[String(mhsId)] = item;
        }
    });
    const peserta = Object.values(pesertaMap);

    // Ambil SEMUA CPMK (Induk + Sub) beserta pemetaan CPL-nya -- pemetaan CPL bisa
    // ada di level Induk ATAU Sub-CPMK (sesuai levelPemetaan MK), jadi tidak boleh
    // difilter parentId:null saja, supaya MK yang levelPemetaan='Sub-CPMK' tetap terbaca.
    const cpmkList = await CapaianMataKuliah.findAll({
        where: { siakMataKuliahId: mkId },
        include: [{
            model: CapaianPembelajaranLulusan, as: 'cplDiCPMK',
            attributes: ['id', 'kode'],
            through: { attributes: ['bobotCpl'] }
        }]
    });

    // Nilai per CPMK AKTUAL (Induk atau Sub) -- TIDAK dikolapskan ke Induk, karena
    // tiap Sub-CPMK bisa punya pemetaan CPL berbeda-beda dan nilai sendiri-sendiri.
    const nilaiCpmkRaw = await sequelize.query(`
        SELECT
            n.siak_mahasiswa_id,
            n.siak_capaian_mata_kuliah_id AS cpmk_id,
            AVG(n.nilai)::FLOAT AS avg_nilai
        FROM siak_nilai_cpmk_mahasiswa n
        WHERE n.siak_kelas_kuliah_id = :kelasId
          AND n.deleted_at IS NULL
        GROUP BY n.siak_mahasiswa_id, n.siak_capaian_mata_kuliah_id
    `, {
        replacements: { kelasId },
        type: sequelize.QueryTypes.SELECT
    });

    const nilaiCpmkMap = {};
    nilaiCpmkRaw.forEach(row => {
        const mId = String(row.siak_mahasiswa_id);
        const cId = String(row.cpmk_id);
        if (!nilaiCpmkMap[mId]) nilaiCpmkMap[mId] = {};
        nilaiCpmkMap[mId][cId] = parseFloat(row.avg_nilai || 0);
    });

    const targetCpl = Object.fromEntries(cplList.map(c => [c.kode, parseFloat(c.targetCpl || 0)]));
    const rerataSum = Object.fromEntries(cplList.map(c => [c.kode, 0]));
    const rerataCount = Object.fromEntries(cplList.map(c => [c.kode, 0]));

    let no = 1;
    const tabel = peserta.map(item => {
        const mhs = item.krsMahasiswa?.mahasiswa;
        const rawMhsId = mhs?.id || mhs?.getDataValue?.('id') || item.krsMahasiswa?.siakMahasiswaId;
        const safeMhsId = rawMhsId ? String(rawMhsId) : null;
        const nilaiPerCpl = {};

        const mhsAdaNilai = safeMhsId && !!nilaiCpmkMap[safeMhsId];

        cplList.forEach(cpl => {
            if (!mhsAdaNilai) {
                nilaiPerCpl[cpl.kode] = null;
                return;
            }

            // CPL = rata-rata berbobot: Σ(nilaiCPMK × bobotCpl) / Σ(bobotCpl)
            // bobotCpl di sini sudah berupa POIN (bukan persentase), jadi tidak perlu
            // dikalikan ulang dengan bobot CPMK -- lihat services/cpmk.service.js
            let totalBobot = 0, totalNilai = 0;
            cpmkList.forEach(cpmk => {
                const pemetaan = cpmk.cplDiCPMK?.find(c => c.id === cpl.id);
                if (pemetaan) {
                    const bobotCpl = parseFloat(pemetaan.PemetaanCplCpmk?.bobotCpl || 0);
                    const safeCId = String(cpmk.id || cpmk.getDataValue?.('id'));
                    const nilaiCpmk = nilaiCpmkMap[safeMhsId]?.[safeCId];
                    if (nilaiCpmk === undefined || bobotCpl <= 0) return;
                    totalNilai += nilaiCpmk * bobotCpl;
                    totalBobot += bobotCpl;
                }
            });
            const nilaiCpl = totalBobot > 0
                ? parseFloat((totalNilai / totalBobot).toFixed(2))
                : null;
            nilaiPerCpl[cpl.kode] = nilaiCpl;
            if (nilaiCpl !== null) {
                rerataSum[cpl.kode] += nilaiCpl;
                rerataCount[cpl.kode]++;
            }
        });

        return {
            no: no++,
            nim: mhs?.npm || '-',
            nama: mhs?.nama || '-',
            angkatan: mhs?.angkatan || '-',
            ...nilaiPerCpl, // 🟢 SPREAD UNTUK CPL
            nilaiCpl: nilaiPerCpl
        };
    });

    const rerataPerolehan = Object.fromEntries(
        cplList.map(c => [c.kode,
            rerataCount[c.kode] > 0
                ? parseFloat((rerataSum[c.kode] / rerataCount[c.kode]).toFixed(2))
                : null
        ])
    );

    return {
        header: { ...baseHeader, peserta: tabel.length },
        cplInfo: cplList.map(c => ({ id: c.id, kode: c.kode, deskripsi: c.deskripsi })),
        targetCpl,
        tabel,
        ...rerataPerolehan,
        rerataPerolehan
    };
};

// ============================================================
// SERVICE C: RPS DARI KELAS
// ============================================================
export const getRpsFromKelas = async (kelasId, periodeId) => {
    const kelas = await getKelasHeader(kelasId);
    const mkId = kelas.siakMataKuliahId || kelas.siak_mata_kuliah_id;

    const { getFormDetailRps } = await import('./rps.service.js');
    const rpsData = await getFormDetailRps(mkId, periodeId);

    return {
        header: buildHeader(kelas),
        rps: rpsData
    };
};

// ============================================================
// HELPER: Build header dari kelas
// ============================================================
const buildHeader = (kelas) => ({
    programStudi: `${kelas.mataKuliah?.programStudi?.jenjang?.jenjang || 'S1'} - ${kelas.mataKuliah?.programStudi?.nama || '-'}`,
    periode: kelas.periodeAkademik?.nama || '-',
    mataKuliah: `${kelas.mataKuliah?.kode} - ${kelas.mataKuliah?.nama} - ${kelas.mataKuliah?.totalSks} SKS`,
    namaKelas: kelas.nama || '-',
    kurikulum: kelas.mataKuliah?.tahunKurikulum?.tahun || '-',
    sistemKuliah: kelas.sistemKuliah || '-',
    kapasitas: kelas.kapasitas || 0,
    peserta: kelas.jumlahPeminat || 0
});