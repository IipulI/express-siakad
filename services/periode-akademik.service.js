import db from '../models/index.js'
import { getPagination } from "../utils/pagination.js";
import { NotFoundError } from "../utils/custom-error.js";

const { PeriodeAkademik } = db

export const findAll = async (page, size) => {
    const isPaginated = page !== null && size !== null

    let queryBuilder = {
        attributes: {
            exclude: ['createdAt', 'updatedAt', 'deletedAt']
        },
        order: [['kode', 'DESC']],
    }

    if (isPaginated) {
        const { limit, offset } = getPagination(page, size);
        queryBuilder.limit = limit;
        queryBuilder.offset = offset;

        const { count, rows} = await PeriodeAkademik.findAndCountAll(queryBuilder);

        return {
            count,
            rows,
            isPaginated,
        }
    } else {
        const data = await PeriodeAkademik.findAll(queryBuilder);

        return {
            count: data.length,
            rows: data,
            isPaginated: false,
        }
    }
}

export const findActive = async () => {
    const activePeriod = await PeriodeAkademik.findOne({
        attributes: {
            exclude: ['createdAt', 'updatedAt', 'deletedAt']
        },
        where: { status: "Aktif" }
    })

    if(!activePeriod) {
        throw new Error('Tidak ada periode aktif yang ditemukan');
    }

    return activePeriod;
}

export const createPeriodeAkademik = async (periodeAkademikData) => {
    const { siakTahunAjaranId, nama, kode, tanggalMulai, tanggalSelesai } = periodeAkademikData;

    const tahunAjaranExist = await TahunAjaranModels.findByPk(periodeAkademikData.siakTahunAjaranId);
    if (!tahunAjaranExist) {
        throw new Error (`Tahun Ajaran tidak ditemukan`)
    }

    return await PeriodeAkademik.create({
        siak_tahun_ajaran_id: siakTahunAjaranId,
        nama,
        kode,
        tanggal_mulai: tanggalMulai,
        tanggal_selesai: tanggalSelesai,
        status: "Inaktif"
    })
}

export const updatePeriodeAkademik = async (id, updateData) => {
    const existDataPeriodeAkademik = await PeriodeAkademik.findByPk(id)

    if (!existDataPeriodeAkademik) {
        throw new NotFoundError(`Periode Akademik tidak dapat ditemukan`)
    }

    // FIX: sebelumnya .update(updateData) dikirim mentah-mentah -- attribute
    // model ini ditulis snake_case langsung (siak_tahun_ajaran_id, tanggal_mulai,
    // tanggal_selesai, bukan di-mapping ke camelCase kayak model lain), padahal
    // body request dari FE camelCase (siakTahunAjaranId, tanggalMulai, dst).
    // Sequelize .update() diam-diam SKIP key yang gak match attribute apapun,
    // jadi update-nya "sukses" tapi gak beneran ngubah apa-apa. Sekarang
    // di-map eksplisit sama kayak createPeriodeAkademik di atas.
    const { siakTahunAjaranId, nama, kode, tanggalMulai, tanggalSelesai, status } = updateData;
    const payload = {};
    if (siakTahunAjaranId !== undefined) payload.siak_tahun_ajaran_id = siakTahunAjaranId;
    if (nama !== undefined) payload.nama = nama;
    if (kode !== undefined) payload.kode = kode;
    if (tanggalMulai !== undefined) payload.tanggal_mulai = tanggalMulai;
    if (tanggalSelesai !== undefined) payload.tanggal_selesai = tanggalSelesai;
    if (status !== undefined) payload.status = status;

    // Banyak fitur lain (dashboard jadwal, default periode di RPS/Rencana
    // Pembelajaran/Evaluasi, dst) asumsinya cuma ADA SATU periode berstatus
    // "Aktif". Kalau baris ini diubah jadi Aktif, matiin dulu semua periode
    // lain biar gak dobel -- pakai transaksi biar atomik.
    if (payload.status === 'Aktif') {
        return db.sequelize.transaction(async (t) => {
            await PeriodeAkademik.update(
                { status: 'Inaktif' },
                { where: { id: { [db.Sequelize.Op.ne]: id } }, transaction: t }
            );
            await existDataPeriodeAkademik.update(payload, { transaction: t });
            return existDataPeriodeAkademik;
        });
    }

    return existDataPeriodeAkademik.update(payload)
};

export const deletePeriodeAkademik = async (id) => {
    const existDataPeriodeAkademik = await PeriodeAkademik.findByPk(id)
    if (!existDataPeriodeAkademik) {
        throw new NotFoundError(`Periode Akademik tidak dapat ditemukan`)
    }

    await existDataPeriodeAkademik.destroy()
};
