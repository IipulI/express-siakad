'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Menambahkan kolom deleted_at untuk mendukung fitur Paranoid (Soft Delete)
    await queryInterface.addColumn('siak_pemetaan_cpl_mata_kuliah', 'deleted_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // Menghapus kembali kolom deleted_at jika migration di-undo
    await queryInterface.removeColumn('siak_pemetaan_cpl_mata_kuliah', 'deleted_at');
  }
};