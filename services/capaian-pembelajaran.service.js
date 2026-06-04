import models from '../models/index.js';
import * as CustomError from '../utils/custom-error.js';

const {
    KelasKuliah, MataKuliah, ProgramStudi, TahunKurikulum, PeriodeAkademik, Jenjang,
    CapaianMataKuliah, CapaianPembelajaranLulusan,
    NilaiCpmkMahasiswa, RincianKrsMahasiswa, KrsMahasiswa, Mahasiswa,
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

    // Parent CPMK saja (parent_id IS NULL)
    const cpmkList = await CapaianMataKuliah.findAll({
        where: { siakMataKuliahId: mkId, parentId: null },
        order: [['kode', 'ASC']]
    });

    if (cpmkList.length === 0) {
        return {
            header: buildHeader(kelas),
            cpmkInfo: [],
            targetCpmk: {},
            tabel: [],
            rerataPerolehan: {},
            pesan: 'CPMK belum disetup oleh Koordinator MK'
        };
    }

    // Ambil peserta aktif di kelas ini
    const pesertaRaw = await sequelize.query(`
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
    `, {
        replacements: { kelasId },
        type: sequelize.QueryTypes.SELECT
    });

    if (pesertaRaw.length === 0) {
        return {
            header: buildHeader(kelas),
            cpmkInfo: cpmkList.map(c => ({ id: c.id, kode: c.kode, deskripsi: c.deskripsi })),
            targetCpmk: Object.fromEntries(cpmkList.map(c => [c.kode, parseFloat(c.target || 0)])),
            tabel: [],
            rerataPerolehan: {},
            pesan: 'Tidak ada peserta di kelas ini'
        };
    }

    // Ambil nilai CPMK, agregasi sub-CPMK ke parent CPMK via SQL JOIN.
    // Jika CPMK punya parent_id → nilai dikompres ke parent.
    // Jika tidak punya parent_id → pakai nilai langsung.
    const nilaiCpmkRaw = await sequelize.query(`
        SELECT
            n.siak_mahasiswa_id,
            CASE WHEN c.parent_id IS NOT NULL THEN c.parent_id ELSE c.id END AS parent_cpmk_id,
            AVG(n.nilai)::FLOAT AS avg_nilai
        FROM siak_nilai_cpmk_mahasiswa n
        JOIN siak_capaian_mata_kuliah c
            ON c.id = n.siak_capaian_mata_kuliah_id
           AND c.deleted_at IS NULL
        WHERE n.siak_kelas_kuliah_id = :kelasId
          AND n.deleted_at IS NULL
        GROUP BY n.siak_mahasiswa_id, parent_cpmk_id
    `, {
        replacements: { kelasId },
        type: sequelize.QueryTypes.SELECT
    });

    // Bangun map: { mhsId: { parentCpmkId: avg_nilai } }
    const nilaiMap = {};
    nilaiCpmkRaw.forEach(row => {
        const mId = String(row.siak_mahasiswa_id);
        const cId = String(row.parent_cpmk_id);
        if (!nilaiMap[mId]) nilaiMap[mId] = {};
        nilaiMap[mId][cId] = parseFloat(row.avg_nilai || 0);
    });

    // Deteksi pemetaan berbeda: ada nilai tersimpan dengan parent CPMK ID
    // yang tidak cocok dengan cpmkList saat ini
    const currentCpmkIds = new Set(cpmkList.map(c => String(c.id)));
    const storedParentIds = new Set(nilaiCpmkRaw.map(r => String(r.parent_cpmk_id)));
    const pemetaanBerbeda = storedParentIds.size > 0 &&
        [...storedParentIds].some(id => !currentCpmkIds.has(id));

    // Inisialisasi target & rerata (hanya parent CPMK)
    const targetCpmk = {};
    const rerataSum = {};
    const rerataCount = {};
    cpmkList.forEach(c => {
        targetCpmk[c.kode] = parseFloat(c.target || 0);
        rerataSum[c.kode] = 0;
        rerataCount[c.kode] = 0;
    });

    let no = 1;
    const tabel = pesertaRaw.map(p => {
        const safeMhsId = String(p.mahasiswa_id);
        const nilaiPerCpmk = {};
        let sudahDinilai = false;

        cpmkList.forEach(c => {
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
            const semuaMencapai = cpmkList.every(c => {
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
    cpmkList.forEach(c => {
        rerataPerolehan[c.kode] = rerataCount[c.kode] > 0
            ? parseFloat((rerataSum[c.kode] / rerataCount[c.kode]).toFixed(2))
            : null;
    });

    const header = buildHeader(kelas);
    return {
        header: { ...header, peserta: tabel.length },
        cpmkInfo: cpmkList.map(c => ({ id: c.id, kode: c.kode, deskripsi: c.deskripsi })),
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

    const [adaNilaiDikunci, pesertaCountRaw] = await Promise.all([
        RincianKrsMahasiswa.findOne({
            where: { siak_kelas_kuliah_id: kelasId, nilai_akhir: { [require('sequelize').Op.not]: null } }
        }),
        sequelize.query(`
            SELECT COUNT(DISTINCT krs.siak_mahasiswa_id) AS count
            FROM siak_rincian_krs_mahasiswa rkm
            JOIN siak_krs_mahasiswa krs ON rkm.siak_krs_mahasiswa_id = krs.id
            WHERE rkm.siak_kelas_kuliah_id = :kelasId
              AND rkm.deleted_at IS NULL
              AND krs.deleted_at IS NULL
        `, { replacements: { kelasId }, type: sequelize.QueryTypes.SELECT })
    ]);
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

    if (!adaNilaiDikunci) {
        return {
            header: baseHeader,
            pesan: 'Belum ada nilai yang diinput untuk kelas ini.',
            cplInfo: cplList.map(c => ({ id: c.id, kode: c.kode, deskripsi: c.deskripsi })),
            targetCpl: Object.fromEntries(cplList.map(c => [c.kode, parseFloat(c.targetCpl || 0)])),
            tabel: [], rerataPerolehan: {}
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

    const cpmkList = await CapaianMataKuliah.findAll({
        where: { siakMataKuliahId: mkId, parentId: null },
        include: [{
            model: CapaianPembelajaranLulusan, as: 'cplDiCPMK',
            attributes: ['id', 'kode'],
            through: { attributes: ['bobotCpl'] }
        }]
    });

    const cpmkIds = cpmkList.map(c => c.id);
    const nilaiCpmkList = await NilaiCpmkMahasiswa.findAll({
        where: { siak_kelas_kuliah_id: kelasId, siak_capaian_mata_kuliah_id: cpmkIds }
    });

    const nilaiCpmkMap = {};
    nilaiCpmkList.forEach(n => {
        const data = n.toJSON ? n.toJSON() : n; 
        const mId = data.siakMahasiswaId || data.siak_mahasiswa_id;
        const cId = data.siakCapaianMataKuliahId || data.siak_capaian_mata_kuliah_id;
        if (mId && cId) {
            const safeMId = String(mId);
            const safeCId = String(cId);
            if (!nilaiCpmkMap[safeMId]) nilaiCpmkMap[safeMId] = {};
            nilaiCpmkMap[safeMId][safeCId] = parseFloat(data.nilai || 0);
        }
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

            let totalBobot = 0, totalNilai = 0;
            cpmkList.forEach(cpmk => {
                const pemetaan = cpmk.cplDiCPMK?.find(c => c.id === cpl.id);
                if (pemetaan) {
                    const bobot = parseFloat(pemetaan.PemetaanCplCpmk?.bobotCpl || 0);
                    const safeCId = String(cpmk.id || cpmk.getDataValue?.('id'));
                    const nilaiCpmk = nilaiCpmkMap[safeMhsId]?.[safeCId] || 0;
                    totalNilai += nilaiCpmk * (bobot / 100);
                    totalBobot += bobot;
                }
            });
            // CPL = weighted average: Σ(nilaiCPMK × bobot) / Σbobot
            const nilaiCpl = totalBobot > 0
                ? parseFloat((totalNilai / (totalBobot / 100)).toFixed(2))
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