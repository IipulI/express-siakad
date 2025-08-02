'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('siak_periode_akademik', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID
      },
      siak_tahun_ajaran_id: {
        allowNull: false,
        type: Sequelize.UUID,
        references: {
          model: {
            tableName: 'siak_tahun_ajaran',
            schema: 'public'
          },
          key: 'id'
        }
      },
      nama: {
        allowNull: false,
        type: Sequelize.STRING
      },
      kode: {
        allowNull: false,
        type: Sequelize.STRING
      },
      tanggal_mulai: {
        allowNull: false,
        type: Sequelize.DATEONLY
      },
      tanggal_selesai: {
        allowNull: false,
        type: Sequelize.DATEONLY
      },
      status: {
        allowNull: false,
        type: Sequelize.STRING
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

    await queryInterface.addIndex('siak_periode_akademik', ['siak_tahun_ajaran_id'], {
      name: 'siak_periode_akademik_tahun_ajaran_id',
      using: 'BTREE'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('siak_periode_akademik');
  }
};