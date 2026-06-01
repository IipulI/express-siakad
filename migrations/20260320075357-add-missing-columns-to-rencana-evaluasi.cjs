'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    // Tambah kolom syarat_lulus
    await queryInterface.addColumn('siak_rencana_evaluasi', 'syarat_lulus', {
      type: Sequelize.STRING, // Ganti jadi Sequelize.TEXT kalau butuh karakter panjang
      allowNull: true,
    });

    // Tambah kolom deskripsi_inggris (sekalian jaga-jaga kalau belum ada)
    await queryInterface.addColumn('siak_rencana_evaluasi', 'deskripsi_inggris', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('siak_rencana_evaluasi', 'syarat_lulus');
    await queryInterface.removeColumn('siak_rencana_evaluasi', 'deskripsi_inggris');
  }
};