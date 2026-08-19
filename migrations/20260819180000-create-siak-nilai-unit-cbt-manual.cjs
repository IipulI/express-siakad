'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('siak_nilai_unit_cbt_manual', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID
      },
      siak_rincian_krs_mahasiswa_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'siak_rincian_krs_mahasiswa',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      siak_rencana_evaluasi_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'siak_rencana_evaluasi',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      nomor_unit: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      skor_diperoleh: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      skor_maksimal: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      pemetaan_cpmk: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: []
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

    await queryInterface.addIndex('siak_nilai_unit_cbt_manual', ['siak_rincian_krs_mahasiswa_id', 'siak_rencana_evaluasi_id'], {
      name: 'siak_nilai_unit_cbt_manual_krs_rencana_index'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('siak_nilai_unit_cbt_manual');
  }
};
