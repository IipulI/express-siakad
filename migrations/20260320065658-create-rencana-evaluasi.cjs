'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('siak_rencana_evaluasi', {
      id: { allowNull: false, primaryKey: true, type: Sequelize.UUID },
      siak_mata_kuliah_id: { 
        type: Sequelize.UUID, 
        allowNull: false, 
        references: { model: 'siak_mata_kuliah', key: 'id' } 
      },
      jenis_evaluasi: { type: Sequelize.STRING, allowNull: false }, // cth: "UTS", "Tugas 1"
      bobot: { type: Sequelize.INTEGER, allowNull: false }, // cth: 20 (untuk 20%)
      deskripsi: { type: Sequelize.TEXT, allowNull: true },
      cpmk: { type: Sequelize.STRING, allowNull: true }, // cth: "CPMK-1, CPMK-2"
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE },
      deleted_at: { allowNull: true, type: Sequelize.DATE }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('siak_rencana_evaluasi');
  }
};