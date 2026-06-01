'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Tambah kolom parent_id ke tabel siak_capaian_mata_kuliah
    await queryInterface.addColumn('siak_capaian_mata_kuliah', 'parent_id', {
      type: Sequelize.UUID,
      allowNull: true,
      // Jika ingin ada relasi fisik di DB (FK):
      references: {
        model: 'siak_capaian_mata_kuliah',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

  async down(queryInterface, Sequelize) {
    // Hapus kolom jika migration di-rollback
    await queryInterface.removeColumn('siak_capaian_mata_kuliah', 'parent_id');
  }
};