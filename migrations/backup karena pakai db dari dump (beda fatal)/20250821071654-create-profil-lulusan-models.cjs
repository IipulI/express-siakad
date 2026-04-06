'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('siak_profil_lulusan', {
      id: { allowNull: false, primaryKey: true, type: Sequelize.UUID },
      siak_obe_id: { type: Sequelize.UUID },
      kode: { type: Sequelize.STRING },
      profil: { type: Sequelize.STRING },
      profesi: { type: Sequelize.STRING },
      deskripsi: { type: Sequelize.TEXT },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: true, type: Sequelize.DATE },
      deleted_at: { allowNull: true, type: Sequelize.DATE }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('siak_profil_lulusan');
  }
};