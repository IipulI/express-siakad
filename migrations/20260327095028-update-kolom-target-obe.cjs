'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Hapus kolom target_capaian yang salah/lama (dibungkus try-catch agar aman)
    try {
      await queryInterface.removeColumn('siak_obe', 'target_capaian');
    } catch (error) {
      console.log('Kolom target_capaian tidak ada, lanjut eksekusi pembuatan kolom baru...');
    }

    // 2. Tambahkan kolom target_cpl
    await queryInterface.addColumn('siak_obe', 'target_cpl', {
      type: Sequelize.DOUBLE,
      allowNull: true,
      defaultValue: 0
    });

    // 3. Tambahkan kolom target_cpmk
    await queryInterface.addColumn('siak_obe', 'target_cpmk', {
      type: Sequelize.DOUBLE,
      allowNull: true,
      defaultValue: 0
    });
  },

  async down(queryInterface, Sequelize) {
    // 1. Hapus kedua kolom baru jika di-rollback
    await queryInterface.removeColumn('siak_obe', 'target_cpl');
    await queryInterface.removeColumn('siak_obe', 'target_cpmk');

    // 2. Kembalikan kolom target_capaian yang lama
    await queryInterface.addColumn('siak_obe', 'target_capaian', {
      type: Sequelize.DOUBLE,
      allowNull: true,
      defaultValue: 0
    });
  }
};