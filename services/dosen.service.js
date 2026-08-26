import db from "../models/index.js"
import { Op } from "sequelize";
import axios from "axios";
import { getPagination } from "../utils/pagination.js";
import { NotFoundError, InternalServerError } from "../utils/custom-error.js";

const {
    Dosen,
    UnitKerja
} = db

// FIX 2026-08-19: sebelumnya dipakai di findOneById tapi gak pernah
// didefinisikan (ReferenceError), bikin endpoint detail dosen selalu crash.
const ADMIN_LIST_ATTRIBUTES = [
    'id', 'nama', 'nidn', 'nip', 'gelarDepan', 'gelarBelakang',
    'jenisKelamin', 'emailPegawai', 'jabatanFungsional', 'statusAktif'
];

const SIMPEG_DOSEN_ROLE_NAMES = ['dosen', 'dosen lb'];

export const findOneById = async (id) => {
    const dosen = await Dosen.findOne({
        where: { id, isDosen: true },
        attributes: ADMIN_LIST_ATTRIBUTES
    });

    if (!dosen) {
        throw new NotFoundError('Data dosen tidak ditemukan');
    }

    return dosen;
}

export const fetchAllDosen = async (page, size, filter) => {
    const isPaginated = page !== null && size !== null;
    const queryBuilder = {
        attributes: [
            'id', 'nama', 'nidn', 'nip', 'gelarDepan', 'gelarBelakang',
            'jenisKelamin', 'emailPegawai', 'jabatanFungsional', 'statusAktif'
        ],
        where: { isDosen: true },
        order: [['nama', 'ASC']]
    }

    if (filter?.search) {
        queryBuilder.where = {
            isDosen: true,
            [Op.or]: [
                { nama: { [Op.iLike]: `%${filter.search}%` } },
                { nidn: { [Op.iLike]: `%${filter.search}%` } },
                { nip: { [Op.iLike]: `%${filter.search}%` } }
            ]
        };
    }

    if (isPaginated) {
        const { limit, offset } = getPagination(page, size);
        queryBuilder.limit = limit;
        queryBuilder.offset = offset;

        const { count, rows } = await Dosen.findAndCountAll(queryBuilder)

        return {
            count,
            rows,
            isPaginated: true
        }
    }
    else {
        const data = await Dosen.findAll(queryBuilder)

        return {
            count: data.length,
            rows: data,
            isPaginated: false
        }
    }
}

const resolveUnitKerjaId = async (unitKerjaNama) => {
    if (!unitKerjaNama) return null;
    const normalized = unitKerjaNama.trim().toLowerCase();

    const match = await UnitKerja.findOne({
        where: db.sequelize.where(
            db.sequelize.fn('lower', db.sequelize.fn('trim', db.sequelize.col('nama'))),
            normalized
        ),
    });

    return match ? match.id : null;
}

export const syncFromSimpeg = async () => {
    const apiUrl = process.env.SIMPEG_EXTERNAL_API_URL;
    const apiKey = process.env.EXTERNAL_SYNC_API_KEY;

    if (!apiUrl || !apiKey) {
        throw new InternalServerError('Konfigurasi sinkronisasi Simpeg (SIMPEG_EXTERNAL_API_URL / EXTERNAL_SYNC_API_KEY) belum diatur');
    }

    let response;
    try {
        response = await axios.get(apiUrl, {
            headers: { 'x-api-key': apiKey },
            timeout: 30000,
        });
    } catch (error) {
        throw new InternalServerError(`Gagal menghubungi API Simpeg: ${error.message}`);
    }

    const items = response.data?.data?.items;
    if (!response.data?.success || !Array.isArray(items)) {
        throw new InternalServerError('Format response API Simpeg tidak sesuai');
    }

    const stats = { total: items.length, inserted: 0, updated: 0, skipped: 0 };

    for (const item of items) {
        const role = (item.role || '').trim().toLowerCase();
        if (!SIMPEG_DOSEN_ROLE_NAMES.includes(role) || !item.nip) {
            stats.skipped++;
            continue;
        }

        const unitKerjaId = await resolveUnitKerjaId(item.unit_kerja);

        const fields = {
            nama: item.nama,
            nidn: item.nidn,
            isDosen: true,
            unitKerjaId,
        };

        const existing = await Dosen.findOne({ where: { nip: item.nip }, paranoid: false });

        if (existing) {
            await existing.update(fields);
            stats.updated++;
        } else {
            await Dosen.create({
                nip: item.nip,
                siakUserId: null,
                isPegawai: false,
                ...fields,
            });
            stats.inserted++;
        }
    }

    return stats;
}