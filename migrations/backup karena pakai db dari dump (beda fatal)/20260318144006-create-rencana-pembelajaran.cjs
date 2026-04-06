'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('siak_rencana_pembelajaran', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
      },
      siak_mata_kuliah_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'siak_mata_kuliah', // Pastikan nama tabel referensinya benar
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      sesi: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      cpmk_sub_cpmk: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      materi_pembelajaran: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      indikator_penilaian: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      metode_pembelajaran: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('siak_rencana_pembelajaran');
  }
};