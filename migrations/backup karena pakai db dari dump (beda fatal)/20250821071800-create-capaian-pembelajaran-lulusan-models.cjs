'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('siak_capaian_pembelajaran_lulusan', {
      id: { allowNull: false, primaryKey: true, type: Sequelize.UUID },
      siak_obe_id: { type: Sequelize.UUID },
      kode: { type: Sequelize.STRING },
      deskripsi: { type: Sequelize.TEXT },
      kategori: { type: Sequelize.STRING },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: true, type: Sequelize.DATE },
      deleted_at: { allowNull: true, type: Sequelize.DATE }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('siak_capaian_pembelajaran_lulusan');
  }
};