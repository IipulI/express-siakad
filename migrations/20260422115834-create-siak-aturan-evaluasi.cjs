'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('siak_aturan_evaluasi', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
        allowNull: false,
      },
      siak_tahun_kurikulum_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'siak_tahun_kurikulum', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      siak_jenjang_id: {
        type: Sequelize.UUID,
        allowNull: false,
        // Uncomment jika tabel siak_jenjang sudah ada
        references: { model: 'siak_jenjang', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      semester_ke: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      total_sks_minimal: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      batas_ipk_minimal: {
        type: Sequelize.DOUBLE,
        allowNull: false,
        defaultValue: 0.00
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('siak_aturan_evaluasi');
  }
};