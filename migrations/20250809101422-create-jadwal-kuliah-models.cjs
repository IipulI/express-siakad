'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('siak_jadwal_kuliah', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      siak_kelas_kuliah_id: {
        type: Sequelize.UUID,
        references: {
            model: {
                tableName: 'siak_kelas_kuliah',
                schema: 'public'
            },
            key: 'id'
        }
      },
      siak_ruangan_id: {
          type: Sequelize.UUID,
          references: {
              model: {
                  tableName: 'siak_ruangan',
                  schema: 'public'
              },
              key: 'id'
          }
      },
      siak_dosen_id: {
          type: Sequelize.UUID,
          references: {
              model: {
                  tableName: 'siak_dosen',
                  schema: 'public'
              },
              key: 'id'
          }
      },
      hari: {
          allowNull: false,
          type: Sequelize.STRING
      },
      jam_mulai: {
          allowNull: false,
          type: Sequelize.TIME
      },
      jam_selesai: {
          allowNull: false,
          type: Sequelize.TIME
      },
      jenis_pertemuan: {
          allowNull: false,
          type: Sequelize.STRING
      },
      metode_pembelajaran: {
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
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('siak_jadwal_kuliah');
  }
};