'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('siak_krs_mahasiswa', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID
      },
      siak_mahasiswa_id: {},
      siak_periode_akademik_id: {},
      status: {
          allowNull: false,

      },
      sks_diambil: {
          allowNull: false,
      },
      semester: {
          allowNull: false,

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
    await queryInterface.dropTable('siak_krs_mahasiswa');
  }
};