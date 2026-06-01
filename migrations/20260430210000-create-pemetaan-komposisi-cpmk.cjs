'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('siak_pemetaan_komposisi_cpmk', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        allowNull: false
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
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('siak_pemetaan_komposisi_cpmk');
  }
};
