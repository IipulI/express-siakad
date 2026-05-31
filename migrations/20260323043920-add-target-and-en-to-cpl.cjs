'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Tambah kolom deskripsi bahasa Inggris
    await queryInterface.addColumn('siak_capaian_pembelajaran_lulusan', 'deskripsi_en', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    
    // Tambah kolom target CPL
    await queryInterface.addColumn('siak_capaian_pembelajaran_lulusan', 'target_cpl', {
      type: Sequelize.FLOAT, // Pakai FLOAT atau DECIMAL biar bisa simpan nilai koma seperti 0.00
      allowNull: true,
      defaultValue: 0.00
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Rollback jika terjadi kesalahan
    await queryInterface.removeColumn('siak_capaian_pembelajaran_lulusan', 'deskripsi_en');
    await queryInterface.removeColumn('siak_capaian_pembelajaran_lulusan', 'target_cpl');
  }
};