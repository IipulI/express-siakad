import {getPagination} from "../utils/pagination.js";
import models from "../models/index.js"
import { QueryTypes, Op } from "sequelize";
import ResponseBuilder from "../utils/response.js";
import { BadRequestError, NotFoundError, ConflictError } from "../utils/custom-error.js";

const {
    BidangIlmu,
    Dosen,
    JadwalKuliah,
    Jenjang,
    KelasKuliah,
    KrsMahasiswa,
    Mahasiswa,
    MataKuliah,
    PeriodeAkademik,
    ProgramStudi,
    RincianKrsMahasiswa,
    Ruangan,
    TahunKurikulum,
    UnsurNilai,
    sequelize,
} = models;

export const test = async () => {
    const test = await BidangIlmu.findByPk("1120cbc9-415d-499e-bf74-9ff4ab5ed331", {
        attributes: ['id']
    })

    await test.destroy()
}

// FIX 2026-08-23: filter dari query string kadang keisi literal string
// "undefined"/"null" (bukan JS undefined beneran) kalau caller nge-construct
// URL dari variabel yang belum keisi (mis. ${siakPeriodeAkademikId} pas
// variabelnya undefined) -- sebelumnya lolos semua pengecekan di bawah
// (bukan `undefined` asli, bukan string kosong), diteruskan apa adanya ke
// where clause Sequelize, lalu Postgres nolak 500 karena bukan UUID valid
// (kolom2 id di sini semua UUID). Ketauan dari gejala nyata: dosen buka
// list kelasnya sendiri tanpa milih Periode dulu -> kosong/500, giliran
// pilih periode manual baru muncul. isValid() nyaring ketiganya sekaligus.
const isValid = (val) => val !== undefined && val !== null && val !== '' && val !== 'undefined' && val !== 'null'

export const findAll = async (page, size, filter) => {
    let kelasKuliahWhere = {}
    let mataKuliahWhere = {}
    let dosenWhere = {}
    let dosenNipNidnWhere = {}
    let activePeriodWhere = {}
    let mahasiswaInclude = null

    if (isValid(filter.siakPeriodeAkademikId)) {
        kelasKuliahWhere.siakPeriodeAkademikId = filter.siakPeriodeAkademikId
    }
    if (isValid(filter.siakProgramStudiId)) {
        kelasKuliahWhere.siakProgramStudiId = filter.siakProgramStudiId
    }
    if (isValid(filter.sistemKuliah)) {
        kelasKuliahWhere.sistemKuliah = filter.sistemKuliah
    }
    if (isValid(filter.siakTahunKurikulumId)) {
        mataKuliahWhere.siakTahunKurikulumId = filter.siakTahunKurikulumId
    }
    if (isValid(filter.siakDosenId)) {
        dosenWhere.id = filter.siakDosenId
    }
    if (isValid(filter.search)) {
        mataKuliahWhere.nama = { [Op.iLike]: `%${filter.search}%` }
    }
    if (isValid(filter.nip)) {
        dosenNipNidnWhere.nip = filter.nip
    }
    if (isValid(filter.nidn)) {
        dosenNipNidnWhere.nidn = filter.nidn
    }
    if (isValid(filter.isActive)) {
        activePeriodWhere.status = filter.isActive === "true" ? { [Op.iLike]: "Aktif" } : { [Op.iLike]: "Inaktif" }
    }
    if (isValid(filter.npm)) {
        const mahasiswa = await Mahasiswa.findOne({
            attributes: ['id'],
            where: { npm: filter.npm }
        })

        mahasiswaInclude = {
            attributes: ['id', 'siakKrsMahasiswaId', 'siakKelasKuliahId'],
            model: RincianKrsMahasiswa,
            as: 'rincianKrsMahasiswa',
            required: false,
            include: {
                attributes: ['id', 'siakMahasiswaId', 'status'],
                model: KrsMahasiswa,
                as: 'krsMahasiswa',
                required: false,
                where: { siakMahasiswaId: mahasiswa.id }
            }
        }
    }

    if (Object.keys(dosenWhere).length > 0 || Object.keys(dosenNipNidnWhere).length > 0) {
        dosenWhere = {
            [Op.or]: [
                ...(Object.keys(dosenWhere).length > 0 ? [dosenWhere] : []),
                ...(Object.keys(dosenNipNidnWhere).length > 0 ? [dosenNipNidnWhere] : [])
            ]
        }

        const jadwalRows = await JadwalKuliah.findAll({
            attributes: ['siakKelasKuliahId'],
            where: { deletedAt: null },
            include: {
                model: Dosen,
                as: 'dosen',
                attributes: [],
                required: true,
                where: dosenWhere
            },
            raw: true
        })

        const kelasIds = [...new Set(jadwalRows.map(r => r.siakKelasKuliahId))]

        kelasKuliahWhere.id = { [Op.in]: kelasIds }
    }

    let kelasKuliahQueryBuilder = {
        attributes: [
            'id', 'siakMataKuliahId', 'siakPeriodeAkademikId',
            'nama', 'kapasitas', 'jumlah_peminat', 'sistem_kuliah', 'status_kelas'
        ],
        where: kelasKuliahWhere,
        include: [
            {
                attributes: [ 'id', 'nama', 'kode', 'totalSks'],
                where: mataKuliahWhere,
                required: Object.keys(mataKuliahWhere).length > 0,
                model: MataKuliah,
                as: 'mataKuliah',
                include: [
                    {
                        attributes: ['id', 'nama'],
                        model: ProgramStudi,
                        as: 'programStudi',
                        include: {
                            model: Jenjang,
                            as: 'jenjang'
                        }
                    },
                    {
                        attributes: ['id', 'tahun'],
                        model: TahunKurikulum,
                        as: 'tahunKurikulum',
                    }
                ]
            },
            {
                where: activePeriodWhere,
                required: Object.keys(activePeriodWhere).length > 0,
                attributes: ['id', 'nama'],
                model: PeriodeAkademik,
                as: 'periodeAkademik'
            },
            {
                attributes: ['id', 'hari', 'jamMulai', 'jamSelesai', 'jenisPertemuan', 'metodePembelajaran'],
                model: JadwalKuliah,
                as: 'jadwalKuliah',
                separate: Object.keys(dosenWhere).length === 0,
                required: Object.keys(dosenWhere).length > 0,
                include: [
                    {
                        where: dosenWhere,
                        required: Object.keys(dosenWhere).length > 0,
                        attributes: ['id', 'nama', 'nidn'],
                        model: Dosen,
                        as: 'dosen'
                    },
                    {
                        attributes: ['id', 'nama', 'ruangan'],
                        model: Ruangan,
                        as: 'ruangan'
                    }
                ]
            },
            ...(mahasiswaInclude ? [mahasiswaInclude] : [])
        ]
    }

    const isPaginated = page !== null && size !== null;
    if (isPaginated) {
        const { limit, offset } = getPagination(page, size);
        kelasKuliahQueryBuilder.limit = limit;
        kelasKuliahQueryBuilder.offset = offset;

        const { count, rows } = await KelasKuliah.findAndCountAll(kelasKuliahQueryBuilder)

        return {
            count,
            rows: await withStatusPenilaian(rows),
            isPaginated: true
        }
    } else{
        const data = await KelasKuliah.findAll(kelasKuliahQueryBuilder)

        return {
            count: data.length,
            rows: await withStatusPenilaian(data),
            isPaginated: false
        }
    }
}

// ─────────────────────────────────────────────
// STATUS PENILAIAN per kelas (kolom "Status Penilaian" di list Kelas Kuliah)
// -- dihitung dari status RincianKrsMahasiswa: "Sudah Dikunci" kalau SEMUA
// peserta terkunci/final, "Sebagian Dikunci" kalau campur, "Belum Dikunci"
// kalau belum ada satupun, "Belum Ada Peserta" kalau kelasnya kosong.
// ─────────────────────────────────────────────
const STATUS_TERKUNCI = ['Dikunci', 'Lulus', 'Tidak Lulus'];

const withStatusPenilaian = async (rows) => {
    const plain = rows.map(r => r.toJSON());
    const kelasIds = plain.map(r => r.id);
    if (kelasIds.length === 0) return plain;

    const agregat = await sequelize.query(`
        SELECT
            siak_kelas_kuliah_id AS "kelasId",
            COUNT(*) AS total,
            COUNT(*) FILTER (WHERE status IN (:statusTerkunci)) AS terkunci
        FROM siak_rincian_krs_mahasiswa
        WHERE siak_kelas_kuliah_id IN (:kelasIds) AND deleted_at IS NULL
        GROUP BY siak_kelas_kuliah_id
    `, {
        replacements: { kelasIds, statusTerkunci: STATUS_TERKUNCI },
        type: sequelize.QueryTypes.SELECT
    });

    const statusMap = {};
    agregat.forEach(row => {
        const total = parseInt(row.total, 10);
        const terkunci = parseInt(row.terkunci, 10);
        statusMap[row.kelasId] =
            total === 0 ? 'Belum Ada Peserta' :
            terkunci === 0 ? 'Belum Dikunci' :
            terkunci === total ? 'Sudah Dikunci' :
            'Sebagian Dikunci';
    });

    return plain.map(r => ({ ...r, statusPenilaian: statusMap[r.id] || 'Belum Ada Peserta' }));
};

const checkScheduleConflict = async (jadwalList, siakPeriodeAkademikId, transaction) => {
    for (let i = 0; i < jadwalList.length; i++) {
        const a = jadwalList[i];

        for (let j = i + 1; j < jadwalList.length; j++) {
            const b = jadwalList[j];
            if (a.hari !== b.hari) continue;
            const overlap = a.jamMulai < b.jamSelesai && a.jamSelesai > b.jamMulai;
            if (!overlap) continue;

            if (a.siakRuanganId === b.siakRuanganId) {
                throw new ConflictError(`Jadwal bentrok: ruangan sudah dipakai pada hari ${a.hari} jam ${a.jamMulai}-${a.jamSelesai}`);
            }
            if (a.siakDosenId && b.siakDosenId && a.siakDosenId === b.siakDosenId) {
                throw new ConflictError(`Jadwal bentrok: dosen sudah mengajar pada hari ${a.hari} jam ${a.jamMulai}-${a.jamSelesai}`);
            }
        }

        const orConditions = [{ siakRuanganId: a.siakRuanganId }];
        if (a.siakDosenId) orConditions.push({ siakDosenId: a.siakDosenId });

        const conflict = await JadwalKuliah.findOne({
            where: {
                hari: a.hari,
                jamMulai: { [Op.lt]: a.jamSelesai },
                jamSelesai: { [Op.gt]: a.jamMulai },
                [Op.or]: orConditions
            },
            include: {
                model: KelasKuliah,
                as: 'kelasKuliah',
                attributes: [],
                required: true,
                where: { siakPeriodeAkademikId }
            },
            transaction
        });

        if (conflict) {
            const isRuanganConflict = conflict.siakRuanganId === a.siakRuanganId;
            throw new ConflictError(
                isRuanganConflict
                    ? `Ruangan sudah terpakai pada hari ${a.hari} jam ${a.jamMulai}-${a.jamSelesai}`
                    : `Dosen sudah memiliki jadwal lain pada hari ${a.hari} jam ${a.jamMulai}-${a.jamSelesai}`
            );
        }
    }
};

const validateRuanganCapacity = async (jadwalList, kapasitasKelas) => {
    const ruanganIds = [...new Set(jadwalList.map((j) => j.siakRuanganId).filter(Boolean))];
    if (ruanganIds.length === 0) return;

    const ruanganList = await Ruangan.findAll({
        where: { id: ruanganIds },
        attributes: ['id', 'nama', 'ruangan', 'kapasitas']
    });

    for (const ruangan of ruanganList) {
        if (kapasitasKelas > ruangan.kapasitas) {
            throw new ConflictError(
                `Kapasitas kelas (${kapasitasKelas}) melebihi kapasitas ruangan ${ruangan.nama} - ${ruangan.ruangan} (${ruangan.kapasitas})`
            );
        }
    }
};

export const createClass = async (payload) => {
    try {
        const {
            siakMataKuliahId,
            siakPeriodeAkademikId,
            namaKelas, // For backward compatibility or if they use namaKelas
            nama,      // The actual field name in their new JSON example might be 'nama'
            kapasitas,
            sistemKuliah,
            jumlahPertemuan,
            tanggalMulai,
            tanggalSelesai,
            jadwalKuliah
        } = payload;

        // Cari MK untuk dapetin prodi
        const mk = await MataKuliah.findByPk(siakMataKuliahId);
        if (!mk) throw new NotFoundError("Mata Kuliah tidak ditemukan");

        const kapasitasKelas = kapasitas || 40;

        if (Array.isArray(jadwalKuliah) && jadwalKuliah.length > 0) {
            await validateRuanganCapacity(jadwalKuliah, kapasitasKelas);
        }

        return await sequelize.transaction(async (t) => {
            const newClass = await KelasKuliah.create({
                siakMataKuliahId: siakMataKuliahId,
                siakPeriodeAkademikId: siakPeriodeAkademikId,
                siakProgramStudiId: mk.siakProgramStudiId,
                nama: nama || namaKelas,
                kapasitas: kapasitasKelas,
                jumlahPeminat: 0,
                sistemKuliah: sistemKuliah,
                statusKelas: "Dibuka",
                jumlahPertemuan: jumlahPertemuan,
                tanggalMulai: tanggalMulai,
                tanggalSelesai: tanggalSelesai
            }, { transaction: t });

            if (Array.isArray(jadwalKuliah) && jadwalKuliah.length > 0) {
                await checkScheduleConflict(jadwalKuliah, siakPeriodeAkademikId, t);

                await JadwalKuliah.bulkCreate(
                    jadwalKuliah.map((jadwal) => ({
                        siakKelasKuliahId: newClass.id,
                        siakRuanganId: jadwal.siakRuanganId,
                        siakDosenId: jadwal.siakDosenId || null,
                        hari: jadwal.hari,
                        jamMulai: jadwal.jamMulai,
                        jamSelesai: jadwal.jamSelesai,
                        jenisPertemuan: jadwal.jenisPertemuan,
                        metodePembelajaran: jadwal.metodePembelajaran
                    })),
                    { transaction: t }
                );
            }

            return newClass;
        });
    } catch (error) {
        if (error.status) throw error;
        throw new Error(`Gagal membuat kelas: ${error.message}`);
    }
}

export const detailClass = async (id) => {
    const dataClass = await KelasKuliah.findByPk(id, {
        attributes: {
            exclude: ['createdAt', 'updatedAt', 'deletedAt']
        },
        include: [
            {
                attributes: [
                    'id', 'nama'
                ],
                model: ProgramStudi,
                as: 'programStudi',
            },
            {
                attributes: [
                    'id', 'nama', 'kode', 'totalSks'
                ],
                model: MataKuliah,
                as: 'mataKuliah',
                include: [
                    {
                        attributes: [
                            'id', 'nama'
                        ],
                        model: ProgramStudi,
                        as: 'programStudi',
                    },
                    {
                        model: TahunKurikulum,
                        as: 'tahunKurikulum',
                    }
                ]
            },
            {
                attributes: [
                    'id', 'nama',
                ],
                model: PeriodeAkademik,
                as: 'periodeAkademik'
            },
            {
                attributes: [
                    'id', 'hari', 'jamMulai', 'jamSelesai', 'jenisPertemuan', 'metodePembelajaran'
                ],
                model: JadwalKuliah,
                as: 'jadwalKuliah',
                separate: true
            }
        ]
    })
    if (!dataClass) {
        throw new NotFoundError(`Kelas Kuliah tidak dapat ditemukan`)
    }

    return dataClass
}

export const updateClass = async (id, payload) => {
    const existClass = await KelasKuliah.findByPk(id)
    if (!existClass) {
        throw new NotFoundError(`Kelas Kuliah tidak dapat ditemukan`)
    }

    const {
        nama,
        kapasitas,
        sistemKuliah,
        statusKelas,
        jumlahPertemuan,
        tanggalMulai,
        tanggalSelesai
    } = payload;

    if (kapasitas !== undefined && kapasitas !== null) {
        const jadwalList = await JadwalKuliah.findAll({
            where: { siakKelasKuliahId: id },
            attributes: ['siakRuanganId']
        });
        if (jadwalList.length > 0) {
            await validateRuanganCapacity(jadwalList.map(j => ({ siakRuanganId: j.siakRuanganId })), kapasitas);
        }
    }

    return existClass.update({
        nama,
        kapasitas,
        sistemKuliah,
        statusKelas,
        jumlahPertemuan,
        tanggalMulai,
        tanggalSelesai
    })
}

export const deleteClass = async (id) => {
    const existClass = await KelasKuliah.findByPk(id)
    if (!existClass) {
        throw new NotFoundError(`Kelas Kuliah tidak dapat ditemukan`)
    }

    const enrolledCount = await RincianKrsMahasiswa.count({
        where: { siakKelasKuliahId: id }
    })
    if (enrolledCount > 0) {
        throw new ConflictError(`Kelas Kuliah tidak dapat dihapus karena sudah memiliki ${enrolledCount} mahasiswa terdaftar`)
    }

    await existClass.destroy()
}

export const classSchedule = async(id) => {
    const existClass = await KelasKuliah.findByPk(id)
    if (!existClass) {
        throw new NotFoundError(`Kelas Kuliah tidak ditemukan`)
    }

    return await JadwalKuliah.findAll({
        attributes: {
            exclude: ['createdAt', 'updatedAt', 'deletedAt', 'siak_dosen_id', 'siak_kelas_kuliah_id', 'siak_ruangan_id']
        },
        where: {
            siakKelasKuliahId: id
        },
        include: [
            {
                attributes: [
                    'id', 'nama', 'nidn'
                ],
                model: Dosen,
                as: 'dosen'
            },
            {
                attributes: [
                    'id', 'nama', 'ruangan'
                ],
                model: Ruangan,
                as: 'ruangan'
            }
        ]
    });
}

export const addClassSchedule = async (id, jadwalKuliah) => {
    const existClass = await KelasKuliah.findByPk(id, { attributes: ['id', 'kapasitas', 'siakPeriodeAkademikId'] });
    if (!existClass) {
        throw new NotFoundError(`Kelas Kuliah tidak ditemukan`);
    }

    if (!Array.isArray(jadwalKuliah) || jadwalKuliah.length === 0) {
        throw new BadRequestError("Data jadwal tidak boleh kosong");
    }

    await validateRuanganCapacity(jadwalKuliah, existClass.kapasitas);

    return await sequelize.transaction(async (t) => {
        await checkScheduleConflict(jadwalKuliah, existClass.siakPeriodeAkademikId, t);

        return await JadwalKuliah.bulkCreate(
            jadwalKuliah.map((jadwal) => ({
                siakKelasKuliahId: id,
                siakRuanganId: jadwal.siakRuanganId,
                siakDosenId: jadwal.siakDosenId || null,
                hari: jadwal.hari,
                jamMulai: jadwal.jamMulai,
                jamSelesai: jadwal.jamSelesai,
                jenisPertemuan: jadwal.jenisPertemuan,
                metodePembelajaran: jadwal.metodePembelajaran
            })),
            { transaction: t }
        );
    });
}

export const deleteClassSchedule = async (id, jadwalId) => {
    const jadwal = await JadwalKuliah.findOne({
        where: { id: jadwalId, siakKelasKuliahId: id }
    });
    if (!jadwal) {
        throw new NotFoundError(`Jadwal kuliah tidak ditemukan`);
    }

    await jadwal.destroy();
}

export const classParticipant = async(id) => {
    const existClass = await KelasKuliah.findByPk(id, {attributes: ['id']})
    if (!existClass) {
        throw new NotFoundError(`Kelas Kuliah tidak ditemukan`)
    }

    const rincianList = await RincianKrsMahasiswa.findAll({
        attributes: ['id', 'status'],
        where: { siak_kelas_kuliah_id: id },
        include: {
            attributes: ['id'],
            model: KrsMahasiswa,
            as: 'krsMahasiswa',
            include: {
                attributes: ['id', 'nama', 'npm', 'angkatan'],
                model: Mahasiswa,
                as: 'mahasiswa',
                include: {
                    attributes: ['id', 'nama'],
                    model: ProgramStudi,
                    as: 'programStudi',
                    include: {
                        attributes: ['jenjang'],
                        model: Jenjang,
                        as: 'jenjang'
                    }
                }
            }
        }
    });

    return rincianList.map(r => ({
        ...r.krsMahasiswa?.mahasiswa?.toJSON(),
        status: r.status,
        rincianKrsId: r.id,
    }));
}

export const enrollMahasiswaToClass = async(mahasiswaId, kelasKuliahId, periodeAkademikId) => {
    const GET_SKS_SUMMARY_SQL = `
        WITH LatestHasilStudi AS (
          SELECT
            hs.siak_mahasiswa_id,
            hs.ips,
            ROW_NUMBER() OVER(PARTITION BY hs.siak_mahasiswa_id ORDER BY hs.semester DESC) as rn
          FROM
            siak_hasil_studi hs
          WHERE hs.siak_mahasiswa_id = :mahasiswaId
        )
        SELECT
          COALESCE(bs.batas_sks, 21) AS "maxSksAllowed",
          COALESCE(krs.sks_diambil, 0) AS "sksTaken"
        FROM
          siak_mahasiswa m
        LEFT JOIN
          (SELECT * FROM LatestHasilStudi WHERE rn = 1) AS hs ON m.id = hs.siak_mahasiswa_id
        LEFT JOIN
          siak_batas_sks bs ON hs.ips >= bs.ips_min AND hs.ips < bs.ips_max
        LEFT JOIN
          siak_krs_mahasiswa krs ON m.id = krs.siak_mahasiswa_id AND krs.siak_periode_akademik_id = :periodeAkademikId
        WHERE
          m.id = :mahasiswaId;
    `;

    // --- 1. GATHER DATA ---
    const targetKelas = await KelasKuliah.findByPk(kelasKuliahId, {
        attributes: ['id', 'jumlahPeminat'],
        include: {
            attributes: ['id','nama', 'totalSks'],
            model: MataKuliah,
            as: 'mataKuliah',
            required: true
        },
    });
    if (!targetKelas) throw new Error('Kelas kuliah tidak ditemukan.');

    const targetMataKuliah = targetKelas.mataKuliah;
    const sksSummaryResult = await sequelize.query(GET_SKS_SUMMARY_SQL, {
        replacements: { mahasiswaId, periodeAkademikId },
        type: QueryTypes.SELECT,
        plain: true,
    });
    if (!sksSummaryResult) throw new Error('Mahasiswa tidak ditemukan atau data SKS tidak lengkap.');

    // --- 2. VALIDATION CHECKS ---
    // Check #1: SKS Limit
    const sksNeeded = targetMataKuliah.totalSks;
    if ((sksSummaryResult.sksTaken + sksNeeded) > sksSummaryResult.maxSksAllowed) {
        throw new Error(`Batas SKS tidak mencukupi. Sisa: ${sksSummaryResult.maxSksAllowed - sksSummaryResult.sksTaken}, dibutuhkan: ${sksNeeded}.`);
    }

    // Check #2: Duplicate course in the same semester
    const existingEnrollment = await RincianKrsMahasiswa.findOne({
        attributes: ['id', 'siakKelasKuliahId'],
        include: [
            { model: KrsMahasiswa, as: 'krsMahasiswa', where: { siakMahasiswaId: mahasiswaId, siakPeriodeAkademikId: periodeAkademikId }, required: true },
            { model: KelasKuliah, as: 'kelasKuliah', where: { siakMataKuliahId: targetMataKuliah.id }, required: true },
        ],
    });
    if (existingEnrollment) {
        // Check if the existing enrollment is for the exact same class
        if (existingEnrollment.siakKelasKuliahId === kelasKuliahId) {
            throw new Error('Mahasiswa sudah terdaftar di kelas ini.');
        } else {
            // Otherwise, it's for a different class of the same course
            throw new Error('Mahasiswa sudah mengambil mata kuliah ini di kelas lain.');
        }
    }

    // Check #3: Passed course in a past semester
    const pastPassedEnrollment = await RincianKrsMahasiswa.findOne({
        attributes: ['id', 'hurufMutu', 'nilai'],
        where: { status: "Lulus" },
        include: [
            { model: KrsMahasiswa, as: 'krsMahasiswa', where: { siakMahasiswaId: mahasiswaId, siakPeriodeAkademikId: { [Op.ne]: periodeAkademikId } }, required: true },
            { model: KelasKuliah, as: 'kelasKuliah', where: { siakMataKuliahId: targetMataKuliah.id }, required: true },
        ],
    });
    if (pastPassedEnrollment) throw new Error(`Sudah lulus mata kuliah ini dengan nilai ${pastPassedEnrollment.nilai}.`);

    // --- 3. WRITE TRANSACTION ---
    return sequelize.transaction(async (t) => {
        const [krs] = await KrsMahasiswa.findOrCreate({
            where: { siakMahasiswaId: mahasiswaId, siakPeriodeAkademikId: periodeAkademikId },
            defaults: { status: 'Draft', sksDiambil: 0 },
            transaction: t,
        });

        const newRincianKrs = await RincianKrsMahasiswa.create({
            siakKrsMahasiswaId: krs.id,
            siakKelasKuliahId: kelasKuliahId,
            kategori: 'Baru', // You could add logic here to check for past failures and set this to 'MENGULANG'
        }, { transaction: t });

        // Update the total SKS taken and the class participant count
        await krs.increment('sksDiambil', { by: sksNeeded, transaction: t });
        await targetKelas.increment('jumlahPeminat', { by: 1, transaction: t });

        return newRincianKrs;
    });
}

export const moveMahasiswaToOtherClass = async (mahasiswaId, sourceKelasKuliahId, targetKelasKuliahId, periodeAkademikId) => {

}

export const deleteMahasiswaFromClass = async(mahasiswaId, kelasKuliahId, periodeAkademikId) => {
    const mahasiswa = await Mahasiswa.findByPk(mahasiswaId, {
        attributes: ['id', 'nama'],
        where: { id: mahasiswaId }
    })
    if(!mahasiswa){
        throw new NotFoundError("Mahasiswa tidak dapat ditemukan")
    }

    const rincianKrs = await RincianKrsMahasiswa.findOne({
        attributes: ['id'],
        where: {
            siakKelasKuliahId: kelasKuliahId
        },
        include: {
            model: KrsMahasiswa,
            as: 'krsMahasiswa',
            where: {
                siakMahasiswaId: mahasiswaId,
                siakPeriodeAkademikId: periodeAkademikId,
            }
        }
    })
    if(!rincianKrs){
        throw new NotFoundError("Kelas kuliah tidak dapat ditemukan")
    }

    await rincianKrs.destroy()
}

// DEPRECATED: grading 4-komponen (kehadiran/tugas/uts/uas) lama, sudah digantikan
// alur OBE berbasis RencanaEvaluasi (lihat POST /dosen/kelas/:kelasId/nilai/:krsId).
export const getGradingClass = async(id) => {
    throw new Error("Endpoint ini sudah tidak digunakan. Gunakan GET /rps/mata-kuliah/:id/rencana-evaluasi dan endpoint daftar peserta kelas untuk melihat komponen & nilai evaluasi.");
}

export const submitGradingClass = async(id, body) => {
    throw new Error("Endpoint ini sudah tidak digunakan. Gunakan POST /dosen/kelas/:kelasId/nilai/:krsId untuk menyimpan nilai evaluasi mahasiswa.");
}