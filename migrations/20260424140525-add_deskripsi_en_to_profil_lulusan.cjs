'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('siak_profil_lulusan', 'deskripsi_en', {
      type: Sequelize.TEXT,
      allowNull: true, // Kita buat null dulu biar data lama nggak error
      after: 'deskripsi' // Biar urutannya rapi di sebelah deskripsi Indo (Khusus MySQL, di Postgres akan di akhir)
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('siak_profil_lulusan', 'deskripsi_en');
  }
};