'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('siak_pemetaan_cpl_mata_kuliah', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false
      },
      siak_mata_kuliah_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'siak_mata_kuliah',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      siak_capaian_pembelajaran_lulusan_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'siak_capaian_pembelajaran_lulusan',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('siak_pemetaan_cpl_mata_kuliah');
  }
};