'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('siak_cpl_umum', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'), 
        primaryKey: true,
        allowNull: false,
      },
      siak_tahun_kurikulum_id: {
        type: Sequelize.UUID,
        allowNull: false,
       
        references: {
          model: 'siak_tahun_kurikulum', 
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      kode: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      deskripsi_ind: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      deskripsi_eng: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      target_cpl: {
        type: Sequelize.DOUBLE,
        defaultValue: 0,
        allowNull: true,
      },
      kategori: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      tingkat_cpl: {
        type: Sequelize.STRING(100),
        allowNull: true,
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
        allowNull: true, // Allow null karena pakai fitur paranoid (soft delete)
      }
    });
  },

  async down(queryInterface, Sequelize) {
    // Fungsi rollback (untuk membatalkan/menghapus tabel)
    await queryInterface.dropTable('siak_cpl_umum');
  }
};