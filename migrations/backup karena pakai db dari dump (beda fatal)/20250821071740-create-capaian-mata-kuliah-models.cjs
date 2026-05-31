'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('siak_capaian_mata_kuliah', {
      id: { allowNull: false, primaryKey: true, type: Sequelize.UUID },
      siak_obe_id: { type: Sequelize.UUID, allowNull: false },
      siak_mata_kuliah_id: { type: Sequelize.UUID, allowNull: false },
      kode: { type: Sequelize.STRING },
      deskripsi: { type: Sequelize.TEXT },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: true, type: Sequelize.DATE },
      deleted_at: { allowNull: true, type: Sequelize.DATE }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('siak_capaian_mata_kuliah');
  }
};