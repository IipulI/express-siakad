'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('siak_pemetaan_evaluasi_cpmk', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID
      },
      siak_rencana_evaluasi_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'siak_rencana_evaluasi', // Nama tabel Rencana Evaluasi
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      siak_cpmk_id: {
        type: Sequelize.UUID,
        allowNull: false,
        // Asumsi nama tabel CPMK Abang adalah siak_capaian_mata_kuliah. 
        // Kalau beda, nanti tinggal disesuaikan ya Bang.
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
        allowNull: true,
        type: Sequelize.DATE
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('siak_pemetaan_evaluasi_cpmk');
  }
};