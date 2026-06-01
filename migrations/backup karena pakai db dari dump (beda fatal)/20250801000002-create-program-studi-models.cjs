'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('siak_program_studi', {
      id: { allowNull: false, primaryKey: true, type: Sequelize.UUID },
      siak_fakultas_id: { type: Sequelize.UUID },
      siak_jenjang_id: { type: Sequelize.UUID },
      nama: { type: Sequelize.STRING, allowNull: false },
      kode: { type: Sequelize.STRING, allowNull: false },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: true, type: Sequelize.DATE },
      deleted_at: { allowNull: true, type: Sequelize.DATE }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('siak_program_studi');
  }
};