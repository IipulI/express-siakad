'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('siak_rencana_evaluasi', 'metode_evaluasi', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn('siak_rencana_evaluasi', 'syarat_lulus', { type: Sequelize.BOOLEAN, defaultValue: false });
    await queryInterface.addColumn('siak_rencana_evaluasi', 'deskripsi_inggris', { type: Sequelize.TEXT, allowNull: true });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('siak_rencana_evaluasi', 'metode_evaluasi');
    await queryInterface.removeColumn('siak_rencana_evaluasi', 'syarat_lulus');
    await queryInterface.removeColumn('siak_rencana_evaluasi', 'deskripsi_inggris');
  }
};