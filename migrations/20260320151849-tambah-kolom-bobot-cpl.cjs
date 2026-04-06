'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Tambah kolom bobot_cpl ke tabel pivot
    await queryInterface.addColumn('siak_pemetaan_cpl_cpmk', 'bobot_cpl', {
      type: Sequelize.FLOAT, // FLOAT agar bisa menampung angka desimal/persentase
      allowNull: true,
      defaultValue: 0
    });
  },

  async down(queryInterface, Sequelize) {
    // Hapus kolom jika migrasi di-undo
    await queryInterface.removeColumn('siak_pemetaan_cpl_cpmk', 'bobot_cpl');
  }
};