'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('siak_hasil_studi', {
      id: { allowNull: false, primaryKey: true, type: Sequelize.UUID },
      siak_mahasiswa_id: { type: Sequelize.UUID },
      siak_periode_akademik_id: { type: Sequelize.UUID },
      semester: { type: Sequelize.INTEGER },
      ips: { type: Sequelize.DOUBLE(5, 2) },
      ipk: { type: Sequelize.DOUBLE(5, 2) },
      sks_diambil: { type: Sequelize.INTEGER },
      sks_lulus: { type: Sequelize.INTEGER },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: true, type: Sequelize.DATE },
      deleted_at: { allowNull: true, type: Sequelize.DATE }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('siak_hasil_studi');
  }
};