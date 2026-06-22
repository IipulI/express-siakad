'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Cukup 3 kolom ini saja, karena siak_rps_id sudah ada dari bawaan temen Abang
    await queryInterface.addColumn('siak_mata_kuliah', 'sks_simulasi', { type: Sequelize.INTEGER, allowNull: true });
    await queryInterface.addColumn('siak_mata_kuliah', 'koordinator_mk_id', { type: Sequelize.UUID, allowNull: true });
    await queryInterface.addColumn('siak_mata_kuliah', 'pengembang_rps_id', { type: Sequelize.UUID, allowNull: true });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('siak_mata_kuliah', 'sks_simulasi');
    await queryInterface.removeColumn('siak_mata_kuliah', 'koordinator_mk_id');
    await queryInterface.removeColumn('siak_mata_kuliah', 'pengembang_rps_id');
  }
};