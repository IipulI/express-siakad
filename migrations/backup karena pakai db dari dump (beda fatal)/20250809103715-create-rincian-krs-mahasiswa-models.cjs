'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('siak_rincian_krs_mahasiswa', {
      id: { allowNull: false, primaryKey: true, type: Sequelize.UUID },
      siak_krs_mahasiswa_id: { type: Sequelize.UUID },
      siak_kelas_kuliah_id: { type: Sequelize.UUID },
      kategori: { type: Sequelize.STRING },
      status: { type: Sequelize.STRING },
      kehadiran: { type: Sequelize.DOUBLE(5,2) },
      tugas: { type: Sequelize.DOUBLE(5,2) },
      uts: { type: Sequelize.DOUBLE(5,2) },
      uas: { type: Sequelize.DOUBLE(5,2) },
      nilai: { type: Sequelize.DOUBLE(5,2) },
      huruf_mutu: { type: Sequelize.STRING(3) },
      angka_mutu: { type: Sequelize.DOUBLE(5,2) },
      nilai_akhir: { type: Sequelize.DOUBLE(5,2) },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: true, type: Sequelize.DATE },
      deleted_at: { allowNull: true, type: Sequelize.DATE }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('siak_rincian_krs_mahasiswa');
  }
};