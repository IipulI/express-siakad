'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('siak_tahun_kurikulum', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID
      },
      siak_periode_akademik_id: {
        allowNull: false,
        type: Sequelize.UUID,
        references: {
          model: {
            tableName: 'siak_periode_akademik',
            schema: 'public'
          },
          key: 'id'
        }
      },
      tahun: {
        allowNull: false,
        type: Sequelize.STRING
      },
      keterangan: {
        allowNull:false,
        type: Sequelize.STRING
      },
      tanggal_mulai: {
        allowNull:false,
        type: Sequelize.DATEONLY
      },
      tanggal_selesai: {
        allowNull:false,
        type: Sequelize.DATEONLY
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: true,
        type: Sequelize.DATE
      },
      deleted_at: {
        allowNull: true,
        type: Sequelize.DATE
      }
    });

    await queryInterface.addIndex('siak_tahun_kurikulum', ['siak_periode_akademik_id'], {
      name: 'siak_tahun_kurikulum_periode_akademik_id',
      using: 'BTREE'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('siak_tahun_kurikulum');
  }
};