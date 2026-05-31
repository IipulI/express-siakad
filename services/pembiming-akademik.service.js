import db from '../models/index.js'
import { Op, Sequelize } from 'sequelize'
import { getPagination } from "../utils/pagination.js";
import { ConflictError, NotFoundError } from "../utils/custom-error.js";

const {
    Dosen,
    KrsMahasiswa,
    Mahasiswa,
    PembimbingAkademik,
    PeriodeAkademik,
    HasilStudi,
    StatusMahasiswa,
    sequelize
} = db

export const getAllMahasiswaFiltered = async (filters, userDosen, page, size) => {
    // 1. Setup pagination variables
    const isPaginated = page !== null && size !== null;
    const { limit, offset } = getPagination(page, size);

    // Start a managed transaction to ensure data consistency across all queries.
    const finalData = await sequelize.transaction(async (t) => {
        const {
            siakPeriodeAkademikId,
            keyword,
            semester,
            siakProgramStudiId,
            statusKrs,
            hasPembimbing,
        } = filters;

        // --- Step 0: Find the relevant academic period ---
        let periode;
        if (siakPeriodeAkademikId) {
            periode = await PeriodeAkademik.findByPk(siakPeriodeAkademikId, { transaction: t });
        } else {
            periode = await PeriodeAkademik.findOne({ where: { status: { [Op.iLike]: 'aktif' } }, transaction: t });
        }

        if (!periode) {
            throw new NotFoundError("Periode akademik tidak ditemukan");
        }

        // --- Step 1: Build filtering clauses and get the correct Mahasiswa IDs with Pagination ---
        const whereClause = { periodeMasuk: { [Op.lte]: periode.kode } };
        const includeFilters = [];

        if (keyword) whereClause.nama = { [Op.iLike]: `%${keyword}%` };
        if (semester) whereClause.semester = semester;
        if (siakProgramStudiId) whereClause.siakProgramStudiId = siakProgramStudiId;


        if (userDosen) {
            includeFilters.push({
                model: PembimbingAkademik,
                as: 'pembimbingDosen',
                where: { siakDosenId: userDosen.id },
                required: true,
                attributes: []
            });
        }
        if (statusKrs) {
            includeFilters.push({
                model: KrsMahasiswa,
                as: 'krsTerbaru',
                where: { status: statusKrs, siakPeriodeAkademikId: periode.id },
                required: true,
                attributes: []
            });
        }
        if (hasPembimbing === 'true') {
            includeFilters.push({ model: PembimbingAkademik, as: 'pembimbingDosen', required: true, attributes: [] });
        } else if (hasPembimbing === 'false') {
            whereClause[Op.and] = Sequelize.literal(`NOT EXISTS (SELECT 1 FROM "pembimbing_akademik" AS "pa" WHERE "pa"."siak_mahasiswa_id" = "Mahasiswa"."id")`);
        }

        // Menggunakan findAndCountAll pada tahap pencarian ID
        const { count, rows: filteredMahasiswaIdsResult } = await Mahasiswa.findAndCountAll({
            attributes: ['id'],
            where: whereClause,
            include: includeFilters,
            distinct: true, // Krusial: Mencegah duplikasi count akibat join (include)
            col: 'id',      // Menghitung berdasarkan ID Mahasiswa
            limit: isPaginated ? limit : undefined,
            offset: isPaginated ? offset : undefined,
            order: [['nama', 'ASC']], // Dipindah ke sini agar paginasi konsisten antar halaman
            raw: true,
            transaction: t
        });

        const mahasiswaIds = filteredMahasiswaIdsResult.map(m => m.id);

        if (mahasiswaIds.length === 0) {
            // Return format disesuaikan dengan contoh Anda
            return { count, rows: [], isPaginated };
        }

        // --- Step 2: Fetch the full data for the filtered IDs in parallel ---
        const [mahasiswaList, allHasilStudi, allKrs, allPembimbing] = await Promise.all([
            // Order di sini tetap dipertahankan untuk memastikan urutan akhir
            Mahasiswa.findAll({
                where: { id: { [Op.in]: mahasiswaIds } },
                include: [
                    {
                        attributes: ['id', 'nama'],
                        model:StatusMahasiswa,
                        as: 'statusMahasiswa'
                    }
                ],
                order: [['nama', 'ASC']],
                transaction: t
            }),
            HasilStudi.findAll({ where: { siakMahasiswaId: { [Op.in]: mahasiswaIds } }, order: [['semester', 'DESC']], transaction: t }),
            KrsMahasiswa.findAll({ where: { siakMahasiswaId: { [Op.in]: mahasiswaIds }, siakPeriodeAkademikId: periode.id }, transaction: t }),
            PembimbingAkademik.findAll({
                where: { siakMahasiswaId: { [Op.in]: mahasiswaIds } },
                include: [
                    { model: Dosen, as: 'dosen' },
                    { model: PeriodeAkademik, as: 'periodeAkademik' }
                ],
                order: [[{ model: PeriodeAkademik, as: 'periodeAkademik' }, 'kode', 'DESC']],
                transaction: t
            })
        ]);

        // --- Step 3: Map all the related data back to each student ---
        const hasilStudiMap = new Map();
        for (const hs of allHasilStudi) {
            if (!hasilStudiMap.has(hs.siakMahasiswaId)) {
                hasilStudiMap.set(hs.siakMahasiswaId, hs);
            }
        }

        const krsMap = new Map();
        for (const krs of allKrs) {
            krsMap.set(krs.siakMahasiswaId, krs);
        }

        const pembimbingMap = new Map();
        for (const pa of allPembimbing) {
            if (!pembimbingMap.has(pa.siakMahasiswaId)) {
                pembimbingMap.set(pa.siakMahasiswaId, pa);
            }
        }

        const assembledData = mahasiswaList.map(mahasiswa => {
            const mahasiswaJson = mahasiswa.toJSON();

            mahasiswaJson.hasilStudiTerbaru = hasilStudiMap.get(mahasiswa.id) || null;
            mahasiswaJson.krsTerbaru = krsMap.get(mahasiswa.id) || null;
            mahasiswaJson.pembimbingDosen = pembimbingMap.get(mahasiswa.id) || null;

            return mahasiswaJson;
        });

        // Return data beserta metadata paginasi
        return {
            count,
            rows: assembledData,
            isPaginated
        };
    });

    return finalData;
};

export const assignDosen = async (dosenId, mahasiswaIds, periodeAkademikId) => {
    try {
        await sequelize.transaction(async (trx) => {
            // 1. Get period and validate its existence
            const periode = await PeriodeAkademik.findByPk(periodeAkademikId, {
                attributes: ['id'],
                transaction: trx
            });

            if (!periode) {
                throw new Error(`Periode Akademik dengan ID ${periodeAkademikId} tidak ditemukan`);
            }

            // Validate if all provided mahasiswaIds actually exist
            const existingMahasiswas = await Mahasiswa.findAll({
                where: {id: mahasiswaIds},
                attributes: ['id'],
                transaction: trx
            });

            const foundMahasiswaIds = existingMahasiswas.map(m => m.id);
            const notFoundMahasiswaIds = mahasiswaIds.filter(id => !foundMahasiswaIds.includes(id));

            if (notFoundMahasiswaIds.length > 0) {
                throw new Error(`Beberapa ID Mahasiswa tidak ditemukan: ${notFoundMahasiswaIds.join(', ')}. Pastikan semua data mahasiswa tersedia`);
            }

            // 2. Get existing assignments for this period
            const existingAssignments = await PembimbingAkademik.findAll({
                attributes: ['siakMahasiswaId'],
                where: {
                    siakPeriodeAkademikId: periode.id,
                    siakMahasiswaId: mahasiswaIds // Filter only for the provided student IDs
                },
                transaction: trx
            });

            const existingMahasiswaInPeriod = existingAssignments.map(pa => pa.siakMahasiswaId);

            const mahasiswaToUpdate = [];
            const mahasiswaToCreate = [];

            // 3. Separate Mahasiswa IDs into update and create categories
            for (const mId of mahasiswaIds) {
                if (existingMahasiswaInPeriod.includes(mId)) {
                    mahasiswaToUpdate.push(mId);
                } else {
                    mahasiswaToCreate.push(mId);
                }
            }

            // 4. Update existing assignments
            if (mahasiswaToUpdate.length > 0) {
                await PembimbingAkademik.update(
                    {siakDosenId: dosenId},
                    {
                        where: {
                            siakPeriodeAkademikId: periode.id,
                            siakMahasiswaId: mahasiswaToUpdate,
                        },
                        transaction: trx,
                    }
                );
            }

            // 5. Create new assignments
            if (mahasiswaToCreate.length > 0) {
                const newAssignments = mahasiswaToCreate.map(mId => ({
                    siakDosenId: dosenId,
                    siakMahasiswaId: mId,
                    siakPeriodeAkademikId: periode.id,
                }));

                await PembimbingAkademik.bulkCreate(newAssignments, {transaction: trx});
            }
        });
        console.log(`Dosen ${dosenId} assigned/updated for students in period ${periodeAkademikId} successfully.`);
        return {success: true, message: "Dosen assignment updated successfully."};
    }
    catch (error) {
        throw new Error(error);
    }
}

export const updateKrsMahasiswa = async (krsIds, mahasiswaIds, periodeAkademikId, status) => {
    try {
        await sequelize.transaction(async (trx) => {


            let foundKrs
            if (krsIds !== null) {
                foundKrs = await KrsMahasiswa.findAll({
                    where: {
                        id: { [Op.in]: krsIds },
                        status: {
                            [Op.eq] : "Diajukan"
                        }
                    },
                    attributes: ['id'],
                    transaction: trx,
                });
            }
            else if (mahasiswaIds !== null) {
                foundKrs = await KrsMahasiswa.findAll({
                    where : {
                        siakMahasiswaId: { [Op.in] : mahasiswaIds },
                        siakPeriodeAkademikId: periodeAkademikId,
                        status: { [Op.eq] : "Diajukan" }
                    }
                })
            }

            const foundIds = foundKrs.map(krs => krs.id);
            const notFoundIds = krsIds.filter(id => !foundIds.includes(id));
            if (notFoundIds.length > 0) {
                throw new Error(`KRS dengan ID berikut tidak ditemukan: ${notFoundIds.join(', ')}`);
            }

            await KrsMahasiswa.update({
                status: status,
            }, {
                where: { id: krsIds },
                transaction: trx,
            });
        });
    } catch (error) {
        throw new Error(`Gagal memperbarui status KRS: ${error.message}`);
    }
};