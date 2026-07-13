'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('siak_nilai_subcpmk_evaluasi_mahasiswa', {
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
      siak_cpmk_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'siak_capaian_mata_kuliah',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      skor_mentah: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0
      },
      sumber: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'CBT'
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

    // Cegah duplikat baris utk kombinasi yang sama sebagai jaring pengaman DB-level
    // (lapisan kedua -- lapisan pertama adalah pola wipe & replace di service).
    await queryInterface.addIndex('siak_nilai_subcpmk_evaluasi_mahasiswa', {
      fields: ['siak_rincian_krs_mahasiswa_id', 'siak_rencana_evaluasi_id', 'siak_cpmk_id'],
      unique: true,
      name: 'uniq_nilai_subcpmk_evaluasi_mahasiswa'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('siak_nilai_subcpmk_evaluasi_mahasiswa');
  }
};
