'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Tambah kolom target_capaian di tabel siak_obe
    await queryInterface.addColumn('siak_obe', 'target_capaian', {
      type: Sequelize.DOUBLE,
      allowNull: true,
      defaultValue: 0
    });

    // 2. Tambah kolom keterangan di tabel siak_skala_penilaian
    await queryInterface.addColumn('siak_skala_penilaian', 'keterangan', {
      type: Sequelize.STRING,
      allowNull: true
    });

    // 3. Tambah kolom is_default di tabel siak_skala_penilaian
    await queryInterface.addColumn('siak_skala_penilaian', 'is_default', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: false
    });
  },

  async down(queryInterface, Sequelize) {
    // Rollback jika terjadi kesalahan (Drop kolom)
    await queryInterface.removeColumn('siak_obe', 'target_capaian');
    await queryInterface.removeColumn('siak_skala_penilaian', 'keterangan');
    await queryInterface.removeColumn('siak_skala_penilaian', 'is_default');
  }
};