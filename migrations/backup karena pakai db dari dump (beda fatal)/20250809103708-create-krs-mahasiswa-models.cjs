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
      siak_mahasiswa_id: {
        type: Sequelize.UUID,      // <-- FIXED
        allowNull: false
      },
      siak_periode_akademik_id: {
        type: Sequelize.UUID,      // <-- FIXED
        allowNull: false
      },
      status: {
        type: Sequelize.STRING,    // <-- FIXED (misal: 'Disetujui', 'Menunggu')
        allowNull: false,
      },
      sks_diambil: {
        type: Sequelize.INTEGER,   // <-- FIXED (misal: 24)
        allowNull: false,
      },
      semester: {
        type: Sequelize.INTEGER,   // <-- FIXED (misal: 1, 2, 3...)
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