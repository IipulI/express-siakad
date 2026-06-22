'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Baca dulu struktur tabel yang ada di database sekarang
    const tableDesc = await queryInterface.describeTable('siak_mata_kuliah');

    // 2. Cek dan tambahkan hanya jika kolomnya belum ada
    if (!tableDesc.nama_en) {
      await queryInterface.addColumn('siak_mata_kuliah', 'nama_en', { type: Sequelize.STRING, allowNull: true });
    }
    if (!tableDesc.siak_kelompok_mata_kuliah_id) {
      await queryInterface.addColumn('siak_mata_kuliah', 'siak_kelompok_mata_kuliah_id', { type: Sequelize.UUID, allowNull: true });
    }
    if (!tableDesc.siak_rumpun_mata_kuliah_id) {
      await queryInterface.addColumn('siak_mata_kuliah', 'siak_rumpun_mata_kuliah_id', { type: Sequelize.UUID, allowNull: true });
    }
    if (!tableDesc.sks_simulasi) {
      await queryInterface.addColumn('siak_mata_kuliah', 'sks_simulasi', { type: Sequelize.INTEGER, allowNull: true, defaultValue: 0 });
    }
    if (!tableDesc.merupakan_mku) {
      await queryInterface.addColumn('siak_mata_kuliah', 'merupakan_mku', { type: Sequelize.BOOLEAN, allowNull: true, defaultValue: false });
    }
    if (!tableDesc.ada_sap) {
      await queryInterface.addColumn('siak_mata_kuliah', 'ada_sap', { type: Sequelize.BOOLEAN, allowNull: true, defaultValue: false });
    }
    if (!tableDesc.ada_silabus) {
      await queryInterface.addColumn('siak_mata_kuliah', 'ada_silabus', { type: Sequelize.BOOLEAN, allowNull: true, defaultValue: false });
    }
    if (!tableDesc.ada_bahan_ajar) {
      await queryInterface.addColumn('siak_mata_kuliah', 'ada_bahan_ajar', { type: Sequelize.BOOLEAN, allowNull: true, defaultValue: false });
    }
    if (!tableDesc.ada_diktat) {
      await queryInterface.addColumn('siak_mata_kuliah', 'ada_diktat', { type: Sequelize.BOOLEAN, allowNull: true, defaultValue: false });
    }
  },

  async down(queryInterface, Sequelize) {
    // Biarkan kosong saja atau di-comment isinya supaya aman kalau di-rollback
  }
};