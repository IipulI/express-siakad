'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      'ALTER TABLE "siak_nilai_evaluasi_mahasiswa" ALTER COLUMN "siak_komposisi_nilai_id" DROP NOT NULL'
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      'ALTER TABLE "siak_nilai_evaluasi_mahasiswa" ALTER COLUMN "siak_komposisi_nilai_id" SET NOT NULL'
    );
  }
};
