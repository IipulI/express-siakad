'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('siak_batas_sks', {
      id: { allowNull: false, primaryKey: true, type: Sequelize.UUID },
      siak_jenjang_id: { type: Sequelize.UUID },
      ips_min: { type: Sequelize.INTEGER },
      ips_max: { type: Sequelize.INTEGER },
      batas_sks: { type: Sequelize.INTEGER },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: true, type: Sequelize.DATE },
      deleted_at: { allowNull: true, type: Sequelize.DATE }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('siak_batas_sks');
  }
};