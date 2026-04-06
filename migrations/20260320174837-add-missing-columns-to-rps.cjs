'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    // Tambah deskripsi_mata_kuliah_eng
    await queryInterface.addColumn('siak_rps', 'deskripsi_mata_kuliah_eng', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    // Tambah media_perangkat_lunak
    await queryInterface.addColumn('siak_rps', 'media_perangkat_lunak', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    // Tambah media_perangkat_keras
    await queryInterface.addColumn('siak_rps', 'media_perangkat_keras', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('siak_rps', 'deskripsi_mata_kuliah_eng');
    await queryInterface.removeColumn('siak_rps', 'media_perangkat_lunak');
    await queryInterface.removeColumn('siak_rps', 'media_perangkat_keras');
  }
};