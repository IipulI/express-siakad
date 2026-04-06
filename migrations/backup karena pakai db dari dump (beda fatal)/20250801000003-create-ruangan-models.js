'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('siak_ruangan', {
      id: { allowNull: false, primaryKey: true, type: Sequelize.UUID },
      siak_fakultas_id: { 
        type: Sequelize.UUID, 
        allowNull: false,
        references: { model: 'siak_fakultas', key: 'id' } 
      },
      nama: { type: Sequelize.STRING(50), allowNull: false },
      ruangan: { type: Sequelize.STRING(50), allowNull: false },
      kapasitas: { type: Sequelize.INTEGER, allowNull: false },
      lantai: { type: Sequelize.INTEGER, allowNull: false },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: true, type: Sequelize.DATE },
      deleted_at: { allowNull: true, type: Sequelize.DATE }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('siak_ruangan');
  }
};