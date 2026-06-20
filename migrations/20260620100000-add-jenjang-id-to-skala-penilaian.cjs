'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Longgarkan NOT NULL -- fitur aktif sekarang scoping per Jenjang, bukan
    // per Program Studi lagi. Kolom dipertahankan (nullable) untuk endpoint
    // lama /ketentuan-akademik/skala-nilai yang masih live.
    await queryInterface.changeColumn('siak_skala_penilaian', 'siak_program_studi_id', {
      type: Sequelize.UUID,
      allowNull: true
    });

    await queryInterface.addColumn('siak_skala_penilaian', 'siak_jenjang_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'siak_jenjang',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addIndex('siak_skala_penilaian', ['siak_jenjang_id'], {
      name: 'idx_skala_penilaian_jenjang'
    });

    // Backfill: derive jenjang dari program studi yang sudah ada di baris lama,
    // supaya data lama tidak hilang konteksnya setelah pindah scoping ke jenjang.
    await queryInterface.sequelize.query(`
      UPDATE siak_skala_penilaian sp
      SET siak_jenjang_id = ps.siak_jenjang_id
      FROM siak_program_studi ps
      WHERE sp.siak_program_studi_id = ps.id
        AND sp.siak_jenjang_id IS NULL
    `);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('siak_skala_penilaian', 'idx_skala_penilaian_jenjang');
    await queryInterface.removeColumn('siak_skala_penilaian', 'siak_jenjang_id');
  }
};
