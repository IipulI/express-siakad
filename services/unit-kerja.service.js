// /services/unitKerja.service.js
import db from "../models/index.js";

const { UnitKerja } = db;

/**
 * Ambil semua descendant IDs dari satu unit kerja (recursive)
 * Termasuk ID unit kerja itu sendiri
 */
export const resolveUnitKerjaIds = async (unitKerjaId) => {
    const result = await db.sequelize.query(
        `
        WITH RECURSIVE unit_tree AS (
            SELECT id, jenis
            FROM siak_unit_kerja
            WHERE id = :unitKerjaId
              AND deleted_at IS NULL

            UNION ALL

            SELECT u.id, u.jenis
            FROM siak_unit_kerja u
            INNER JOIN unit_tree ut ON u.parent_id = ut.id
            WHERE u.deleted_at IS NULL
        )
        SELECT id, jenis FROM unit_tree
        `,
        {
            replacements: { unitKerjaId },
            type: db.Sequelize.QueryTypes.SELECT,
        }
    );

    return {
        allIds: result.map((r) => r.id),
        fakultasIds: result.filter((r) => r.jenis === "fakultas").map((r) => r.id),
        prodiIds: result.filter((r) => r.jenis === "prodi").map((r) => r.id),
    };
};

/**
 * Ambil children langsung (1 level) untuk dropdown
 * Sesuai level user dari JWT
 */
export const getDropdownUnitKerja = async (unitKerjaId) => {
    const unitKerja = await UnitKerja.findByPk(unitKerjaId, {
        attributes: ["id", "jenis", "nama", "kode"],
    });

    if (!unitKerja) throw new Error("Unit kerja tidak ditemukan");

    // Kalau prodi, return dirinya sendiri saja
    if (unitKerja.jenis === "prodi") {
        return [unitKerja.toJSON()];
    }

    // Kalau fakultas atau universitas, return children
    const children = await UnitKerja.findAll({
        where: {
            parentId: unitKerjaId,
            deletedAt: null,
        },
        attributes: ["id", "jenis", "nama", "kode"],
        order: [["nama", "ASC"]],
    });

    return children.map((u) => u.toJSON());
};