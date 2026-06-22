'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Menambahkan kolom bobot (bobot CPMK di dalam satu komponen evaluasi)
    await queryInterface.addColumn('siak_pemetaan_komposisi_cpmk', 'bobot', {
      type: Sequelize.FLOAT, // Pakai FLOAT biar bisa nampung koma (16.66)
      allowNull: true,
      defaultValue: 0
    });
  },

  async down(queryInterface, Sequelize) {
    // Rollback: Menghapus kolom bobot
    await queryInterface.removeColumn('siak_pemetaan_komposisi_cpmk', 'bobot');
  }
};
