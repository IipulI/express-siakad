'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('siak_kelas_kuliah', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID
      },
      siak_mata_kuliah_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
              model: {
                  tableName: 'siak_mata_kuliah',
                  schema: 'public'
              },
              key: 'id'
          }
      },
      siak_periode_akademik_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
              model: {
                  tableName: 'siak_periode_akademik',
                  schema: 'public'
              },
              key: 'id'
          }
      },
      siak_rps_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
              model: {
                  tableName: 'siak_rps',
                  schema: 'public'
              },
              key: 'id'
          }
      },
      nama: {
          allowNull: false,
          type: Sequelize.STRING
      },
      kapasitas: {
          allowNull: false,
          type: Sequelize.INTEGER,
      },
      jumlah_peminat: {
          allowNull: true,
          type: Sequelize.INTEGER,
      },
      sistem_kuliah: {
          allowNull: false,
          type: Sequelize.STRING
      },
      status_kelas: {
          allowNull: false,
          type: Sequelize.STRING
      },
      jumlah_pertemuan: {
          allowNull: false,
          type: Sequelize.INTEGER,
      },
      tanggal_mulai: {
          allowNull: false,
          type: Sequelize.DATEONLY,
      },
      tanggal_selesai: {
          allowNull: false,
          type: Sequelize.DATEONLY,
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
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('siak_kelas_kuliah');
  }
};