'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('siak_pemetaan_pl_cpl', {
      id: { allowNull: false, primaryKey: true, type: Sequelize.UUID },
      siak_profil_lulusan_id: { type: Sequelize.UUID },
      siak_capaian_pembelajaran_lulusan_id: { type: Sequelize.UUID },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: true, type: Sequelize.DATE },
      deleted_at: { allowNull: true, type: Sequelize.DATE }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('siak_pemetaan_pl_cpl');
  }
};