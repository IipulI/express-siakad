'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Menambahkan kolom bobot ke tabel pemetaan
    await queryInterface.addColumn('siak_pemetaan_pl_cpl', 'bobot', {
      type: Sequelize.FLOAT, // Pakai FLOAT biar bisa nampung koma (16.66)
      allowNull: true,
      defaultValue: 0
    });
  },

  async down(queryInterface, Sequelize) {
    // Rollback: Menghapus kolom bobot
    await queryInterface.removeColumn('siak_pemetaan_pl_cpl', 'bobot');
  }
};