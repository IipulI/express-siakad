'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('siak_obe', {
      id: { allowNull: false, primaryKey: true, type: Sequelize.UUID },
      siak_program_studi_id: { type: Sequelize.UUID },
      siak_tahun_kurikulum_id: { type: Sequelize.UUID },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: true, type: Sequelize.DATE },
      deleted_at: { allowNull: true, type: Sequelize.DATE }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('siak_obe');
  }
};