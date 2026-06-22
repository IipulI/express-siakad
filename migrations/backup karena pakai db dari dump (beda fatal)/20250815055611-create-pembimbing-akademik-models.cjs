'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('siak_pembimbing_akademik', {
      id: { allowNull: false, primaryKey: true, type: Sequelize.UUID },
      siak_dosen_id: { type: Sequelize.UUID },
      siak_mahasiswa_id: { type: Sequelize.UUID },
      siak_periode_akademik_id: { type: Sequelize.UUID },
      no_sk: { type: Sequelize.STRING },
      tanggal_sk: { type: Sequelize.DATEONLY },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: true, type: Sequelize.DATE },
      deleted_at: { allowNull: true, type: Sequelize.DATE }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('siak_pembimbing_akademik');
  }
};