'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('siak_nilai_evaluasi_mahasiswa', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()')
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
      siak_komposisi_nilai_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'siak_komposisi_nilai_mata_kuliah',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      skor: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        defaultValue: 0
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    await queryInterface.addConstraint('siak_nilai_evaluasi_mahasiswa', {
      fields: ['siak_rincian_krs_mahasiswa_id', 'siak_komposisi_nilai_id'],
      type: 'unique',
      name: 'uq_nilai_eval_krs_komposisi'
    });

    await queryInterface.addIndex('siak_nilai_evaluasi_mahasiswa', ['siak_rincian_krs_mahasiswa_id'], {
      name: 'idx_nilai_eval_krs'
    });

    await queryInterface.addIndex('siak_nilai_evaluasi_mahasiswa', ['siak_komposisi_nilai_id'], {
      name: 'idx_nilai_eval_komposisi'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('siak_nilai_evaluasi_mahasiswa');
  }
};
