'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    // Menambahkan kolom metode_evaluasi ke tabel siak_rencana_evaluasi
    await queryInterface.addColumn('siak_rencana_evaluasi', 'metode_evaluasi', {
      type: Sequelize.STRING, // Sesuaikan tipe datanya, kalau teks panjang bisa pakai Sequelize.TEXT
      allowNull: true,        // Set true dulu biar data yang udah ada sebelumnya nggak error
    });
  },

  async down (queryInterface, Sequelize) {
    // Menghapus kolom jika migration di-rollback
    await queryInterface.removeColumn('siak_rencana_evaluasi', 'metode_evaluasi');
  }
};